import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BANNER_AD_FEE_AMOUNT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// GET - Fetch current user's banners
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await prisma.bannerAd.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching user banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST - Create a new banner (requires payment)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, imageUrl, linkUrl, placement } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
    }

    const banner = await prisma.bannerAd.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl || null,
        placement: placement || 'homepage_top',
        status: 'PENDING_PAYMENT',
        active: false,
        sortOrder: 0,
        amount: BANNER_AD_FEE_AMOUNT,
        currency: 'TTD',
        userId: session.user.id,
        paymentProofUrl: null,
        paymentReference: null,
        verifiedAt: null,
        verifiedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        adminNotes: null,
        startsAt: null,
        endsAt: null,
      },
    });

    return NextResponse.json({
      banner,
      message: `Banner created. Payment of ${BANNER_AD_FEE_AMOUNT} TTD required for activation.`,
      requiresPayment: true,
      paymentAmount: BANNER_AD_FEE_AMOUNT,
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

// PUT - Update user's own banner or submit payment/renew
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      imageUrl,
      linkUrl,
      placement,
      action, // 'update', 'submit_payment', 'renew'
      paymentMethod,
      paymentProofUrl,
      paymentReference,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
    }

    const existing = await prisma.bannerAd.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Banner not found or unauthorized' }, { status: 404 });
    }

    // Handle payment submission
    if (action === 'submit_payment') {
      if (existing.status !== 'PENDING_PAYMENT') {
        return NextResponse.json({ error: 'Banner is not awaiting payment' }, { status: 400 });
      }

      if (!paymentMethod || !paymentProofUrl) {
        return NextResponse.json({ error: 'Payment method and proof are required' }, { status: 400 });
      }

      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          status: 'PENDING_VERIFICATION',
          active: false,
          paymentProofUrl,
          paymentReference: paymentReference || null,
          rejectedAt: null,
          rejectionReason: null,
          adminNotes: null,
        },
      });

      await prisma.feePayment.create({
        data: {
          bannerAdId: id,
          userId: session.user.id,
          purpose: existing.endsAt || existing.status === 'EXPIRED' ? 'BANNER_RENEWAL' : 'BANNER_AD',
          amount: BANNER_AD_FEE_AMOUNT,
          currency: 'TTD',
          method: paymentMethod,
          status: 'PENDING',
          proofUploadUrl: paymentProofUrl,
          reference: paymentReference || null,
        },
      });

      return NextResponse.json({
        banner,
        message: 'Payment proof submitted. Awaiting admin verification.',
      });
    }

    // Handle renewal
    if (action === 'renew') {
      if (!['ACTIVE', 'EXPIRED'].includes(existing.status)) {
        return NextResponse.json({ error: 'Only active or expired banners can be renewed' }, { status: 400 });
      }

      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          status: 'PENDING_PAYMENT',
          active: false,
          paymentProofUrl: null,
          paymentReference: null,
          verifiedAt: null,
          verifiedBy: null,
          rejectedAt: null,
          rejectionReason: null,
          adminNotes: null,
        },
      });

      return NextResponse.json({
        banner,
        message: `Renewal initiated. Payment of ${BANNER_AD_FEE_AMOUNT} TTD required.`,
        requiresPayment: true,
        paymentAmount: BANNER_AD_FEE_AMOUNT,
      });
    }

    // Regular update (only for unpaid banners)
    if (existing.status === 'PENDING_PAYMENT') {
      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
          ...(placement !== undefined && { placement }),
        },
      });

      return NextResponse.json({ banner });
    }

    return NextResponse.json({ error: 'Only unpaid banners can be modified' }, { status: 400 });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE - Delete user's own banner (only if pending payment)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
    }

    const existing = await prisma.bannerAd.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Banner not found or unauthorized' }, { status: 404 });
    }

    if (existing.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: 'Only unpaid banners can be deleted' }, { status: 400 });
    }

    await prisma.bannerAd.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
