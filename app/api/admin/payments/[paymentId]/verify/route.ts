// Admin API - Verify or Reject Payment

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { PAID_LISTING_EXPIRY_DAYS } from '@/lib/constants';

const BANNER_AD_DURATION_DAYS = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = params;
    const body = await request.json();
    const { action, reason } = body as { action: 'VERIFY' | 'REJECT'; reason?: string };

    if (!action || !['VERIFY', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (VERIFY or REJECT)' }, { status: 400 });
    }

    const payment = await prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        listing: true,
        user: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Payment is already ${payment.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const now = new Date();

    // ─── APPROVE ─────────────────────────────────────────────────────────────
    if (action === 'VERIFY') {
      await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: now,
        },
      });

      // Activate a regular/featured listing
      if (payment.listingId) {
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + PAID_LISTING_EXPIRY_DAYS);

        await prisma.listing.update({
          where: { id: payment.listingId },
          data: {
            status: 'ACTIVE',
            publishedAt: payment.listing?.publishedAt || now,
            expiresAt,
            activatedAt: now,
          },
        });

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Verified — Listing Live',
            message: `Your payment for "${payment.listing?.title}" has been verified. Your listing is now live!`,
            linkUrl: `/dashboard/listings/${payment.listingId}`,
          },
        });

        return NextResponse.json({
          message: 'Payment verified and listing activated successfully',
        });
      }

      // Activate a banner ad
      if (payment.bannerAdId) {
        const endsAt = new Date(now);
        endsAt.setDate(endsAt.getDate() + BANNER_AD_DURATION_DAYS);

        await prisma.bannerAd.update({
          where: { id: payment.bannerAdId },
          data: {
            status: 'ACTIVE',
            active: true,
            startsAt: now,
            endsAt,
            verifiedAt: now,
            verifiedBy: session.user.id,
          },
        });

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Verified — Banner Ad Live',
            message: `Your payment for your banner ad has been verified. Your banner is now live and in rotation!`,
            linkUrl: '/dashboard/banners',
          },
        });

        return NextResponse.json({
          message: 'Payment verified and banner ad is now live',
        });
      }

      return NextResponse.json({ message: 'Payment verified' });
    }

    // ─── REJECT ───────────────────────────────────────────────────────────────
    if (action === 'REJECT') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          adminNotes: reason,
        },
      });

      // Listing stays PENDING_PAYMENT — user can resubmit
      if (payment.listingId) {
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Rejected',
            message: `Your payment for "${payment.listing?.title}" was rejected. Reason: ${reason}. You can submit payment again from your listing page.`,
            linkUrl: `/dashboard/listings/${payment.listingId}`,
          },
        });
      }

      // Banner stays non-active — user can resubmit
      if (payment.bannerAdId) {
        await prisma.bannerAd.update({
          where: { id: payment.bannerAdId },
          data: { active: false },
        });

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Banner Ad Payment Rejected',
            message: `Your banner ad payment was rejected. Reason: ${reason}. You can submit payment again from your dashboard.`,
            linkUrl: '/dashboard/banners',
          },
        });
      }

      return NextResponse.json({
        message: 'Payment rejected and user notified. Item remains pending — user can resubmit.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing payment verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
