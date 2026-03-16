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

    // Verify payment belongs to user and is pending
    const payment = await prisma.feePayment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        method: { in: ['BANK_DEPOSIT', 'ONLINE_BANK'] },
        status: 'PENDING',
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found or not eligible for proof upload' }, { status: 404 });
    }

    // Update payment with proof
    await prisma.feePayment.update({
      where: { id: paymentId },
      data: {
        proofUploadUrl: proofUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment proof uploaded successfully. We will verify your payment within 24-48 hours.',
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
