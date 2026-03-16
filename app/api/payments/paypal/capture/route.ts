import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PayPal API endpoints
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentId, listingId } = body;

    if (!orderId || !paymentId || !listingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify payment belongs to user
    const payment = await prisma.feePayment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        listingId,
        method: 'PAYPAL',
        status: { in: ['CREATED', 'PENDING'] },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Capture the PayPal order
    const accessToken = await getPayPalAccessToken();
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
      const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      // Update payment record
      await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paypalOrderId: orderId,
          paypalCaptureId: captureId,
          providerTransactionId: captureId,
        },
      });

      // Activate the listing
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        message: 'Payment successful! Your listing is now active.',
      });
    } else {
      // Payment not completed
      await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          paypalOrderId: orderId,
        },
      });

      return NextResponse.json({
        success: false,
        status: captureData.status,
        message: 'Payment was not completed',
      });
    }
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
