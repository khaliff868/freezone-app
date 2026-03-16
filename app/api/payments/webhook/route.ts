import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PayPal IPN/Webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // PayPal IPN verification
    const paymentStatus = params.get('payment_status');
    const custom = params.get('custom'); // Our payment ID
    const txnId = params.get('txn_id');
    
    if (!custom) {
      console.log('No custom field (payment ID) in webhook');
      return NextResponse.json({ received: true });
    }

    // Find the payment
    const payment = await prisma.feePayment.findUnique({
      where: { id: custom },
    });

    if (!payment) {
      console.log('Payment not found:', custom);
      return NextResponse.json({ received: true });
    }

    // Handle different payment statuses
    if (paymentStatus === 'Completed') {
      // Update payment status
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          providerTransactionId: txnId || undefined,
          paypalOrderId: txnId || undefined,
        },
      });

      // Activate the listing (if payment has a listing)
      if (payment.listingId) {
        await prisma.listing.update({
          where: { id: payment.listingId },
          data: {
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
        });
        console.log('Payment completed and listing activated:', payment.listingId);
      } else {
        console.log('Payment completed (no listing associated):', payment.id);
      }
    } else if (paymentStatus === 'Failed' || paymentStatus === 'Denied') {
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      });
      console.log('Payment failed:', custom);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
