// PayPal Capture Order API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { PAYPAL_API_BASE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '@/lib/constants';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const captureOrderSchema = z.object({
  orderId: z.string(),
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
 * POST /api/payments/capture-order
 * Capture PayPal order after user approval
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
    
    const validationResult = captureOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { orderId } = validationResult.data;

    // Find the payment record
    const payment = await prisma.feePayment.findFirst({
      where: {
        providerTransactionId: orderId,
        userId: session.user.id,
      },
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

    // Check if already paid
    if (payment.status === 'PAID' || payment.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Payment already processed' },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture failed:', errorData);
      
      // Update payment status to FAILED
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Failed to capture payment' },
        { status: 400 }
      );
    }

    const captureData = await captureResponse.json();

    // Check if capture was successful
    if (captureData.status === 'COMPLETED') {
      // Update payment status
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
        },
      });

      // Update listing status to ACTIVE (if payment has a listing)
      if (payment.listingId) {
        await prisma.listing.update({
          where: { id: payment.listingId },
          data: {
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        message: 'Payment successful',
        captureData,
      });
    } else {
      // Update payment status to FAILED
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Payment capture failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
