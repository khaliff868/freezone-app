// Bank Deposit Upload API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculatePostingFee } from '@/lib/tier-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bankDepositSchema = z.object({
  listingId: z.string(),
  reference: z.string().min(1, 'Reference number is required'),
  proofUploadUrl: z.string().url('Invalid proof URL'),
});

/**
 * POST /api/payments/bank-deposit
 * Submit bank deposit for admin verification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validationResult = bankDepositSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { listingId, reference, proofUploadUrl } = validationResult.data;

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if listing requires payment
    if (listing.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Listing does not require payment' },
        { status: 400 }
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.feePayment.findFirst({
      where: {
        listingId,
        status: { in: ['PENDING', 'PAID', 'VERIFIED'] },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment submission already exists for this listing' },
        { status: 400 }
      );
    }

    // Calculate posting fee (same for all users)
    const amount = calculatePostingFee();

    // Create FeePayment record
    const feePayment = await prisma.feePayment.create({
      data: {
        listingId,
        userId: session.user.id,
        amount,
        currency: listing.currency,
        method: 'BANK_DEPOSIT',
        status: 'PENDING',
        reference,
        proofUploadUrl,
      },
    });

    return NextResponse.json(
      {
        message: 'Bank deposit submitted for verification',
        payment: feePayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting bank deposit:', error);
    return NextResponse.json(
      { error: 'Failed to submit bank deposit' },
      { status: 500 }
    );
  }
}
