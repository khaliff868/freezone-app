import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Verify payment status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, listingId } = body;

    if (!paymentId && !listingId) {
      return NextResponse.json({ error: 'Payment ID or Listing ID is required' }, { status: 400 });
    }

    // Find the payment
    const feePayment = await prisma.feePayment.findFirst({
      where: {
        ...(paymentId ? { id: paymentId } : {}),
        ...(listingId ? { listingId } : {}),
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: true,
      },
    });

    if (!feePayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const statusMessages: Record<string, string> = {
      CREATED: 'Payment initiated. Please complete the payment.',
      PENDING: 'Payment pending verification. We will notify you once verified.',
      PAID: 'Payment successful! Your listing is now active.',
      VERIFIED: 'Payment verified! Your listing is active.',
      REJECTED: 'Payment was rejected. Please contact support or try again.',
      FAILED: 'Payment failed. Please try again.',
    };

    return NextResponse.json({
      status: feePayment.status.toLowerCase(),
      method: feePayment.method,
      amount: feePayment.amount,
      currency: feePayment.currency,
      reference: feePayment.reference,
      proofUploaded: !!feePayment.proofUploadUrl,
      listingStatus: feePayment.listing?.status,
      message: statusMessages[feePayment.status] || 'Unknown status',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
