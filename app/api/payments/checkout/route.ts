import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { LISTING_FEE_AMOUNT } from '@/lib/constants';

// Note: Tier system removed - single fee for all users

// Bank details for bank deposit
const BANK_DETAILS = {
  bankName: 'First Citizens Bank',
  accountName: 'Freezone Swap or Sell Ltd',
  accountNumber: '1234567890',
  branchCode: '001',
  instructions: 'Include your listing reference in the payment description',
};

// Payment method type
type PaymentMethodType = 'PAYPAL' | 'ONLINE_BANK' | 'BANK_DEPOSIT';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, method } = body as { listingId: string; method: PaymentMethodType };

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    if (!method || !['PAYPAL', 'ONLINE_BANK', 'BANK_DEPOSIT'].includes(method)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 });
    }

    // Verify listing belongs to user and needs payment
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        userId: session.user.id,
        listingType: { in: ['SELL', 'BOTH'] },
        status: { in: ['DRAFT', 'PENDING_PAYMENT'] },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or not eligible for payment' },
        { status: 400 }
      );
    }

    // Use the standard listing fee (same for all users)
    const feeAmount = LISTING_FEE_AMOUNT;

    // Generate unique reference for bank deposits
    const reference = `TSS-${Date.now().toString(36).toUpperCase()}-${listingId.slice(-4).toUpperCase()}`;

    // Create payment record
    const feePayment = await prisma.feePayment.create({
      data: {
        listingId,
        userId: session.user.id,
        amount: feeAmount,
        currency: 'TTD',
        method,
        status: method === 'PAYPAL' ? 'CREATED' : 'PENDING',
        reference,
      },
    });

    // Update listing status to PENDING_PAYMENT
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'PENDING_PAYMENT' },
    });

    if (method === 'PAYPAL') {
      // For PayPal, we'll use the client-side SDK
      // Return info for client to create PayPal order
      const usdAmount = (feeAmount / 6.8).toFixed(2); // Convert TTD to USD
      return NextResponse.json({
        paymentId: feePayment.id,
        method: 'PAYPAL',
        amount: feeAmount,
        currency: 'TTD',
        usdAmount,
        listingTitle: listing.title,
        reference,
      });
    } else if (method === 'ONLINE_BANK') {
      // Online bank transfer info
      return NextResponse.json({
        paymentId: feePayment.id,
        method: 'ONLINE_BANK',
        amount: feeAmount,
        currency: 'TTD',
        reference,
        bankDetails: BANK_DETAILS,
        instructions: 'Transfer the exact amount to the account below. Use the reference number in your payment description. Your listing will be activated once we verify the payment (usually within 24 hours).',
      });
    } else {
      // Bank deposit info
      return NextResponse.json({
        paymentId: feePayment.id,
        method: 'BANK_DEPOSIT',
        amount: feeAmount,
        currency: 'TTD',
        reference,
        bankDetails: BANK_DETAILS,
        instructions: 'Visit any First Citizens Bank branch and deposit the exact amount. Write the reference number on your deposit slip. Upload your receipt after making the deposit. Your listing will be activated once we verify the payment (usually within 24-48 hours).',
      });
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get payment status and details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    const payment = await prisma.feePayment.findFirst({
      where: {
        listingId,
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return NextResponse.json({ payment: null });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
