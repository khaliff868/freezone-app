// Listing Payment Proof API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { LISTING_FEE_AMOUNT } from '@/lib/constants';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paymentProofSchema = z.object({
  method: z.enum(['PAYPAL', 'ONLINE_BANK', 'BANK_DEPOSIT']),
  proofUrl: z.string().url('Valid proof URL required'),
  reference: z.string().optional(),
  purpose: z.enum(['LISTING_FEE', 'LISTING_RENEWAL']).default('LISTING_FEE'),
});

/**
 * POST /api/listings/[id]/payment
 * Submit payment proof for a listing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = paymentProofSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { method, proofUrl, reference, purpose } = validationResult.data;
    const listingId = params.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only submit payment for your own listings' },
        { status: 403 }
      );
    }

    // Must be in PENDING_PAYMENT status
    if (listing.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'This listing is not awaiting payment' },
        { status: 400 }
      );
    }

    // Check for existing pending payment
    const existingPayment = await prisma.feePayment.findFirst({
      where: {
        listingId,
        status: 'PENDING',
      },
    });

    if (existingPayment) {
      // Update existing payment with new proof
      await prisma.feePayment.update({
        where: { id: existingPayment.id },
        data: {
          method,
          proofUploadUrl: proofUrl,
          reference: reference || null,
        },
      });

      return NextResponse.json({
        message: 'Payment proof updated. Awaiting admin verification.',
        payment: existingPayment,
      });
    }

    // Create new payment record
    const payment = await prisma.feePayment.create({
      data: {
        listingId,
        userId: session.user.id,
        purpose: purpose === 'LISTING_RENEWAL' ? 'LISTING_RENEWAL' : 'LISTING_FEE',
        amount: LISTING_FEE_AMOUNT,
        currency: 'TTD',
        method,
        status: 'PENDING',
        proofUploadUrl: proofUrl,
        reference: reference || null,
      },
    });

    return NextResponse.json({
      message: 'Payment proof submitted. Awaiting admin verification.',
      payment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment proof' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/listings/[id]/payment
 * Get payment status for a listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const listingId = params.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify ownership or admin
    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only view payment for your own listings' },
        { status: 403 }
      );
    }

    const payments = await prisma.feePayment.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      payments,
      requiresPayment: listing.status === 'PENDING_PAYMENT',
      paymentAmount: LISTING_FEE_AMOUNT,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
