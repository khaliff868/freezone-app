import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BANNER_AD_EXPIRY_DAYS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      action, // 'approve', 'reject', 'update'
      reason,
      adminNotes,
      title,
      imageUrl,
      linkUrl,
      placement,
      sortOrder,
      active,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
    }

    const existing = await prisma.bannerAd.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const now = new Date();

    // Handle approval
    if (action === 'approve') {
      if (existing.status !== 'PENDING_VERIFICATION') {
        return NextResponse.json({ error: 'Banner is not awaiting verification' }, { status: 400 });
      }

      if (!existing.paymentProofUrl) {
        return NextResponse.json({ error: 'No payment proof found' }, { status: 400 });
      }

      const endsAt = new Date(now);
      endsAt.setDate(endsAt.getDate() + BANNER_AD_EXPIRY_DAYS);

      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          active: true,
          startsAt: now,
          endsAt,
          verifiedAt: now,
          verifiedBy: session.user.id,
          adminNotes: adminNotes || null,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      await prisma.feePayment.updateMany({
        where: { bannerAdId: id, status: 'PENDING' },
        data: {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: now,
          adminNotes: adminNotes || null,
        },
      });

      if (existing.userId) {
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Banner Ad Approved',
            message: `Your banner ad "${existing.title}" has been approved and is now live!`,
            linkUrl: '/dashboard/banners',
          },
        });
      }

      return NextResponse.json({
        banner,
        message: 'Banner approved and activated',
      });
    }

    // Handle rejection
    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          status: 'REJECTED',
          active: false,
          rejectedAt: now,
          rejectionReason: reason,
          adminNotes: adminNotes || null,
        },
      });

      await prisma.feePayment.updateMany({
        where: { bannerAdId: id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          adminNotes: reason,
        },
      });

      if (existing.userId) {
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Banner Ad Rejected',
            message: `Your banner ad "${existing.title}" was rejected. Reason: ${reason}`,
            linkUrl: '/dashboard/banners',
          },
        });
      }

      return NextResponse.json({
        banner,
        message: 'Banner rejected',
      });
    }

    // Handle direct enable/disable toggle
    if (typeof active === 'boolean') {
      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          active,
        },
      });

      return NextResponse.json({
        banner,
        message: active ? 'Banner enabled' : 'Banner disabled',
      });
    }

    // Regular update
    const banner = await prisma.bannerAd.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
        ...(placement !== undefined && { placement }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}
