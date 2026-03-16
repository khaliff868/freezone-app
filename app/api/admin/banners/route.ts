import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BANNER_AD_EXPIRY_DAYS, BANNER_AD_FEE_AMOUNT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await prisma.bannerAd.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// Admin creates banner directly (can be active immediately for admin-created ads)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, imageUrl, linkUrl, placement, sortOrder } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
    }

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + BANNER_AD_EXPIRY_DAYS);

    const banner = await prisma.bannerAd.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl || null,
        placement: placement || 'homepage_top',
        status: 'ACTIVE',
        active: true,
        sortOrder: sortOrder || 0,
        startsAt: now,
        endsAt,
        amount: 0, // Admin-created - no payment required
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

// Admin actions: approve, reject, update
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      action,  // 'approve', 'reject', 'update'
      reason,
      adminNotes,
      title, 
      imageUrl, 
      linkUrl, 
      placement, 
      sortOrder,
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
      if (existing.status !== 'PENDING_PAYMENT') {
        return NextResponse.json({ error: 'Banner is not pending payment' }, { status: 400 });
      }

      // Check for payment proof
      if (!existing.paymentProofUrl) {
        return NextResponse.json({ error: 'No payment proof found' }, { status: 400 });
      }

      // Calculate expiration: max(current endsAt, now) + BANNER_AD_EXPIRY_DAYS
      let baseDate = now;
      if (existing.endsAt && existing.endsAt > now) {
        baseDate = existing.endsAt;
      }
      const endsAt = new Date(baseDate);
      endsAt.setDate(endsAt.getDate() + BANNER_AD_EXPIRY_DAYS);

      const banner = await prisma.bannerAd.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          active: true,
          startsAt: existing.startsAt || now,
          endsAt,
          adminNotes: adminNotes || null,
        },
      });

      // Update the fee payment record if exists
      await prisma.feePayment.updateMany({
        where: { bannerAdId: id, status: 'PENDING' },
        data: {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: now,
          adminNotes: adminNotes || null,
        },
      });

      // Notify user
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
          rejectedAt: now,
          rejectionReason: reason,
          adminNotes: adminNotes || null,
        },
      });

      // Update the fee payment record if exists
      await prisma.feePayment.updateMany({
        where: { bannerAdId: id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          adminNotes: reason,
        },
      });

      // Notify user
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
    }

    await prisma.bannerAd.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
