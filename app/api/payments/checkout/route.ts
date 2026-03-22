import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const BANK_DETAILS = {
  bankName: 'First Citizens Bank',
  accountName: 'Freezone Swap or Sell Ltd',
  accountNumber: '1234567890',
  branchCode: '001',
  instructions: 'Include your listing reference in the payment description',
};

type PaymentMethodType = 'PAYPAL' | 'ONLINE_BANK' | 'BANK_DEPOSIT';
type ListingPlan = 'FEATURED' | 'REGULAR';

const PREMIUM_CATEGORIES = ['House/Land', 'Business & Industrial', 'Vehicles'];

function isPremiumCategory(category: string): boolean {
  return PREMIUM_CATEGORIES.some(
    p => category === p || category.startsWith(`${p} - `) || category.startsWith(`${p} -`)
  );
}

function getFeeAmount(plan: ListingPlan, category: string): number {
  if (plan === 'FEATURED') return 300;
  return isPremiumCategory(category) ? 100 : 25;
}

function getDurationDays(plan: ListingPlan): number {
  return plan === 'FEATURED' ? 30 : 90;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, method, plan = 'REGULAR' } = body as {
      listingId: string;
      method: PaymentMethodType;
      plan: ListingPlan;
    };

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    if (!method || !['PAYPAL', 'ONLINE_BANK', 'BANK_DEPOSIT'].includes(method)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 });
    }

    if (!['FEATURED', 'REGULAR'].includes(plan)) {
      return NextResponse.json({ error: 'Valid plan is required' }, { status: 400 });
    }

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        userId: session.user.id,
        status: { in: ['DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED'] },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or not eligible for payment' },
        { status: 400 }
      );
    }

    const feeAmount = getFeeAmount(plan, listing.category);
    const durationDays = getDurationDays(plan);
    const isFeatured = plan === 'FEATURED';

    const reference = `TSS-${Date.now().toString(36).toUpperCase()}-${listingId.slice(-4).toUpperCase()}`;

    const feePayment = await prisma.feePayment.create({
      data: {
        listingId,
        userId: session.user.id,
        amount: feeAmount,
        currency: 'TTD',
        method,
        status: method === 'PAYPAL' ? 'CREATED' : 'PENDING',
        reference,
        ...(('adminNotes' in {}) ? {} : {}),
      },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'PENDING_PAYMENT',
        featured: isFeatured ? true : listing.featured,
      },
    });

    const baseResponse = {
      paymentId: feePayment.id,
      method,
      amount: feeAmount,
      currency: 'TTD',
      reference,
      plan,
      durationDays,
      listingTitle: listing.title,
    };

    if (method === 'PAYPAL') {
      const usdAmount = (feeAmount / 6.8).toFixed(2);
      return NextResponse.json({ ...baseResponse, usdAmount });
    }

    if (method === 'ONLINE_BANK') {
      return NextResponse.json({
        ...baseResponse,
        bankDetails: BANK_DETAILS,
        instructions: `Transfer $${feeAmount} TTD to the account below. Use the reference number in your payment description. Your listing will be activated once we verify the payment (usually within 24 hours).`,
      });
    }

    return NextResponse.json({
      ...baseResponse,
      bankDetails: BANK_DETAILS,
      instructions: `Visit any First Citizens Bank branch and deposit $${feeAmount} TTD. Write the reference number on your deposit slip. Upload your receipt after making the deposit. Your listing will be activated within 24-48 hours.`,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      where: { listingId, userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payment: payment || null });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
