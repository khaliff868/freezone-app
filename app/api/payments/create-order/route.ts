// PayPal Create Order API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculatePostingFee } from '@/lib/tier-utils';
import { PAYPAL_API_BASE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '@/lib/constants';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  listingId: z.string(),
});

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * POST /api/payments/create-order
 * Create PayPal order for posting fee
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
    
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { listingId } = validationResult.data;

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
        status: { in: ['PAID', 'VERIFIED'] },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this listing' },
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
        method: 'PAYPAL',
        status: 'CREATED',
      },
    });

    // Create PayPal order
    const accessToken = await getPayPalAccessToken();

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: feePayment.id,
            amount: {
              currency_code: listing.currency,
              value: amount.toFixed(2),
            },
            description: `Posting fee for: ${listing.title}`,
          },
        ],
        application_context: {
          brand_name: 'Freezone Swap or Sell',
          return_url: `${process.env.NEXTAUTH_URL}/dashboard/listings/${listingId}?payment=success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/listings/${listingId}?payment=cancelled`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('PayPal order creation failed:', errorData);
      throw new Error('Failed to create PayPal order');
    }

    const orderData = await orderResponse.json();

    // Update FeePayment with PayPal order ID
    await prisma.feePayment.update({
      where: { id: feePayment.id },
      data: {
        providerTransactionId: orderData.id,
      },
    });

    return NextResponse.json({
      orderId: orderData.id,
      paymentId: feePayment.id,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
