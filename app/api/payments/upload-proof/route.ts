import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, proofUrl } = body;

    if (!paymentId || !proofUrl) {
      return NextResponse.json({ error: 'Payment ID and proof URL are required' }, { status: 400 });
    }

    const payment = await prisma.feePayment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        // All three payment methods are supported
        method: { in: ['BANK_DEPOSIT', 'ONLINE_BANK', 'PAYPAL'] },
        // PENDING (bank/online bank) or CREATED (PayPal initial state)
        status: { in: ['PENDING', 'CREATED'] },
      },
      include: {
        listing: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or not eligible for proof upload' },
        { status: 404 }
      );
    }

    // Save proof URL and move status to PENDING so it appears in Verify Payments
    await prisma.feePayment.update({
      where: { id: paymentId },
      data: {
        proofUploadUrl: proofUrl,
        status: 'PENDING',
      },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) {
      const listingTitle = payment.listing?.title || 'Unknown listing';
      const userName = payment.user?.name || session.user.name || 'A user';
      const userEmail = payment.user?.email || session.user.email || '';
      const methodLabel = payment.method === 'PAYPAL' ? 'PayPal' : payment.method === 'ONLINE_BANK' ? 'Online Bank Transfer' : 'Bank Deposit';

      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'PAYMENT_RECEIVED',
          title: '💳 Payment Proof Submitted',
          message: `${userName} (${userEmail}) submitted ${methodLabel} proof for "${listingTitle}". Amount: ${payment.amount} ${payment.currency}. Please review and approve.`,
          linkUrl: `/admin/payments`,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment proof uploaded successfully. We will verify your payment within 24-48 hours.',
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
