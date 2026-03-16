// Admin API - Verify Bank Deposit

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const verifyPaymentSchema = z.object({
  action: z.enum(['VERIFY', 'REJECT']),
  adminNotes: z.string().optional(),
});

/**
 * POST /api/admin/payments/[id]/verify
 * Verify or reject a bank deposit payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const validationResult = verifyPaymentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { action, adminNotes } = validationResult.data;

    // Fetch payment
    const payment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        listing: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment method is BANK_DEPOSIT or ONLINE_BANK
    if (payment.method !== 'BANK_DEPOSIT' && payment.method !== 'ONLINE_BANK') {
      return NextResponse.json(
        { error: 'Only bank deposits and online bank transfers can be verified' },
        { status: 400 }
      );
    }

    // Check if payment is in PENDING status
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payment is not in pending status' },
        { status: 400 }
      );
    }

    if (action === 'VERIFY') {
      // Verify payment and activate listing
      if (!payment.listingId) {
        return NextResponse.json(
          { error: 'Payment is not associated with a listing' },
          { status: 400 }
        );
      }
      
      await prisma.$transaction([
        prisma.feePayment.update({
          where: { id },
          data: {
            status: 'VERIFIED',
            verifiedBy: session.user.id,
            verifiedAt: new Date(),
            adminNotes: adminNotes ?? undefined,
          },
        }),
        prisma.listing.update({
          where: { id: payment.listingId },
          data: {
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json({
        message: 'Payment verified and listing activated',
      });
    } else {
      // Reject payment
      await prisma.feePayment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          adminNotes: adminNotes ?? undefined,
        },
      });

      return NextResponse.json({
        message: 'Payment rejected',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
