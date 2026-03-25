// Admin API - Listing Management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  FREE_CATEGORY,
  FREE_ITEMS_EXPIRY_DAYS,
  PAID_LISTING_EXPIRY_DAYS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const listingType = searchParams.get('type');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (listingType) where.listingType = listingType;
    if (category) where.category = category;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, tier: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, action, reason } = body;

    if (!listingId || !action) {
      return NextResponse.json(
        { error: 'Listing ID and action are required' },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'approve') {
      const isFreeItemsCategory = listing.category === FREE_CATEGORY;

      if (isFreeItemsCategory) {
        if (listing.status !== 'PENDING_APPROVAL') {
          return NextResponse.json(
            { error: 'Listing is not pending approval' },
            { status: 400 }
          );
        }

        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + FREE_ITEMS_EXPIRY_DAYS);

        const updatedListing = await prisma.listing.update({
          where: { id: listingId },
          data: {
            status: 'ACTIVE',
            publishedAt: listing.publishedAt || now,
            expiresAt,
            activatedAt: now,
          },
        });

        await prisma.notification.create({
          data: {
            userId: listing.userId,
            type: 'LISTING_APPROVED',
            title: 'Listing Approved',
            message: `Your listing "${listing.title}" has been approved and is now live!`,
            linkUrl: `/dashboard/listings/${listing.id}`,
          },
        });

        return NextResponse.json({
          message: 'Free listing approved and now live',
          listing: updatedListing,
        });
      } else {
        if (!['PENDING_APPROVAL', 'PENDING_PAYMENT'].includes(listing.status)) {
          return NextResponse.json(
            { error: 'Listing is not pending review' },
            { status: 400 }
          );
        }

        const updatedListing = await prisma.listing.update({
          where: { id: listingId },
          data: { status: 'PENDING_PAYMENT' },
        });

        await prisma.notification.create({
          data: {
            userId: listing.userId,
            type: 'LISTING_APPROVED',
            title: 'Listing Content Approved',
            message: `Your listing "${listing.title}" has been approved. It will go live once your payment is verified.`,
            linkUrl: `/dashboard/listings/${listing.id}`,
          },
        });

        return NextResponse.json({
          message: 'Listing content approved. Will go live after payment verification.',
          listing: updatedListing,
        });
      }
    }

    if (action === 'approve_payment') {
      if (listing.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: 'Listing is not pending payment' },
          { status: 400 }
        );
      }

      const pendingPayment = await prisma.feePayment.findFirst({
        where: { listingId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });

      if (!pendingPayment) {
        return NextResponse.json(
          { error: 'No pending payment found for this listing' },
          { status: 400 }
        );
      }

      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + PAID_LISTING_EXPIRY_DAYS);

      await prisma.feePayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: now,
        },
      });

      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'ACTIVE',
          publishedAt: listing.publishedAt || now,
          expiresAt,
          activatedAt: now,
        },
      });

      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Verified — Listing Live',
          message: `Your payment for "${listing.title}" has been verified. Your listing is now live!`,
          linkUrl: `/dashboard/listings/${listing.id}`,
        },
      });

      return NextResponse.json({
        message: 'Payment verified and listing activated',
        listing: updatedListing,
      });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'REJECTED',
          rejectedAt: now,
          rejectionReason: reason,
        },
      });

      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'LISTING_APPROVED',
          title: 'Listing Rejected',
          message: `Your listing "${listing.title}" was not approved. Reason: ${reason}`,
          linkUrl: `/dashboard/listings/${listing.id}`,
        },
      });

      return NextResponse.json({
        message: 'Listing rejected',
        listing: updatedListing,
      });
    }

    if (action === 'remove') {
      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'REMOVED' },
      });

      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'LISTING_APPROVED',
          title: 'Listing Removed',
          message: `Your listing "${listing.title}" has been removed by admin.`,
          linkUrl: `/dashboard/listings/${listing.id}`,
        },
      });

      return NextResponse.json({
        message: 'Listing removed successfully',
        listing: updatedListing,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}
