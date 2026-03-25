// Admin API - Banner Ad Management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: any = {};

    if (statusFilter) {
      if (statusFilter === 'PENDING_PAYMENT') {
        where.status = { in: ['PENDING_PAYMENT', 'PENDING_VERIFICATION'] };
      } else if (statusFilter === 'ACTIVE') {
        where.status = 'ACTIVE';
      } else if (statusFilter === 'EXPIRED') {
        where.status = 'EXPIRED';
      } else if (statusFilter === 'REJECTED') {
        where.status = 'REJECTED';
      }
    }

    const banners = await prisma.bannerAd.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bannerId, action, reason } = body;

    if (!bannerId || !action) {
      return NextResponse.json({ error: 'Banner ID and action are required' }, { status: 400 });
    }

    const banner = await prisma.bannerAd.findUnique({
      where: { id: bannerId },
      include: { user: true },
    });

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'approve') {
      if (!['PENDING_PAYMENT', 'PENDING_VERIFICATION'].includes(banner.status)) {
        return NextResponse.json({ error: 'Banner is not pending review' }, { status: 400 });
      }

      await prisma.bannerAd.update({
        where: { id: bannerId },
        data: { status: 'PENDING_PAYMENT' },
      });

      if (banner.userId) {
        await prisma.notification.create({
          data: {
            userId: banner.userId,
            type: 'LISTING_APPROVED',
            title: 'Banner Ad Approved',
            message: `Your banner ad "${banner.title}" has been approved. It will go live once your payment is verified.`,
            linkUrl: '/dashboard/banners',
          },
        });
      }

      return NextResponse.json({ message: 'Banner ad approved — awaiting payment verification' });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.bannerAd.update({
        where: { id: bannerId },
        data: {
          status: 'REJECTED',
          rejectedAt: now,
          rejectionReason: reason,
          active: false,
        },
      });

      if (banner.userId) {
        await prisma.notification.create({
          data: {
            userId: banner.userId,
            type: 'LISTING_APPROVED',
            title: 'Banner Ad Rejected',
            message: `Your banner ad "${banner.title}" was not approved. Reason: ${reason}. You may edit and resubmit.`,
            linkUrl: '/dashboard/banners',
          },
        });
      }

      return NextResponse.json({ message: 'Banner ad rejected and user notified' });
    }

    if (action === 'remove') {
      await prisma.bannerAd.update({
        where: { id: bannerId },
        data: { status: 'REJECTED', active: false },
      });

      if (banner.userId) {
        await prisma.notification.create({
          data: {
            userId: banner.userId,
            type: 'LISTING_APPROVED',
            title: 'Banner Ad Removed',
            message: `Your banner ad "${banner.title}" has been removed by admin.`,
            linkUrl: '/dashboard/banners',
          },
        });
      }

      return NextResponse.json({ message: 'Banner ad removed successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}
