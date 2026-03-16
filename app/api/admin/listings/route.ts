// Admin API - Listing Management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  FREE_CATEGORY, 
  FREE_ITEMS_EXPIRY_DAYS, 
  PAID_LISTING_EXPIRY_DAYS 
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/listings
 * List all listings with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    if (status) {
      where.status = status;
    }

    if (listingType) {
      where.listingType = listingType;
    }

    if (category) {
      where.category = category;
    }

    if (userId) {
      where.userId = userId;
    }

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
            select: {
              id: true,
              name: true,
              email: true,
              tier: true,
            },
          },
          feePayments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
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
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/listings
 * Approve or reject a listing
 * 
 * Actions:
 * - approve: Approve pending_approval listing (for Free Items or renewals)
 * - approve_payment: Verify payment and activate paid listing
 * - reject: Reject a listing with reason
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { listingId, action, reason, adminNotes } = body;

    if (!listingId || !action) {
      return NextResponse.json(
        { error: 'Listing ID and action are required' },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: true,
        feePayments: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    if (action === 'approve') {
      // For PENDING_APPROVAL listings (Free Items or free renewals)
      if (listing.status !== 'PENDING_APPROVAL') {
        return NextResponse.json(
          { error: 'Listing is not pending approval' },
          { status: 400 }
        );
      }

      const isFreeItems = listing.category === FREE_CATEGORY;
      const expiryDays = isFreeItems ? FREE_ITEMS_EXPIRY_DAYS : PAID_LISTING_EXPIRY_DAYS;
      
      // Calculate expiration: max(current expiresAt, now) + expiryDays
      let baseDate = now;
      if (listing.expiresAt && listing.expiresAt > now) {
        baseDate = listing.expiresAt;
      }
      const expiresAt = new Date(baseDate);
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'ACTIVE',
          publishedAt: listing.publishedAt || now,
          expiresAt,
          activatedAt: now,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'LISTING_APPROVED',
          title: 'Listing Approved',
          message: `Your listing "${listing.title}" has been approved and is now live!`,
          linkUrl: `/browse?listing=${listing.id}`,
        },
      });

      return NextResponse.json({
        message: 'Listing approved successfully',
        listing: updatedListing,
      });
    }

    if (action === 'approve_payment') {
      // For PENDING_PAYMENT listings (paid listings after trial)
      if (listing.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: 'Listing is not pending payment' },
          { status: 400 }
        );
      }

      // Verify there's a pending payment with proof
      const pendingPayment = listing.feePayments[0];
      if (!pendingPayment) {
        return NextResponse.json(
          { error: 'No pending payment found for this listing' },
          { status: 400 }
        );
      }

      // Calculate expiration for paid listing
      let baseDate = now;
      if (listing.expiresAt && listing.expiresAt > now) {
        baseDate = listing.expiresAt;
      }
      const expiresAt = new Date(baseDate);
      expiresAt.setDate(expiresAt.getDate() + PAID_LISTING_EXPIRY_DAYS);

      // Update payment status
      await prisma.feePayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: now,
          adminNotes: adminNotes || null,
        },
      });

      // Update listing
      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'ACTIVE',
          publishedAt: listing.publishedAt || now,
          expiresAt,
          activatedAt: now,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Verified',
          message: `Your payment for "${listing.title}" has been verified. Your listing is now live!`,
          linkUrl: `/browse?listing=${listing.id}`,
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
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      // If there was a pending payment, reject it too
      if (listing.feePayments[0]) {
        await prisma.feePayment.update({
          where: { id: listing.feePayments[0].id },
          data: {
            status: 'REJECTED',
            adminNotes: reason,
          },
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'LISTING_APPROVED', // Using this type as there's no LISTING_REJECTED
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

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}
