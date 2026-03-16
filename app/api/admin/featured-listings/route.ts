// Admin API - Featured Listing Management
// Approve, reject, or manage featured listing promotions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  FEATURED_LISTING_DURATION_DAYS,
  FEATURED_LISTING_RENEWAL_DAYS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/featured-listings
 * List all featured listings (pending, active, expired)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING_PAYMENT, ACTIVE, EXPIRED, or all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      featuredStatus: { not: 'NONE' },
    };

    if (status && status !== 'all') {
      where.featuredStatus = status;
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
            },
          },
          feePayments: {
            where: {
              purpose: { in: ['FEATURED_LISTING', 'FEATURED_RENEWAL'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return NextResponse.json({ error: 'Failed to fetch featured listings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/featured-listings
 * Approve or reject featured listing payment
 * 
 * Body:
 * - listingId: string
 * - action: 'approve' | 'reject'
 * - reason?: string (for rejection)
 * - adminNotes?: string
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, action, reason, adminNotes } = body;

    if (!listingId || !action) {
      return NextResponse.json({ error: 'Listing ID and action are required' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: true,
        feePayments: {
          where: {
            purpose: { in: ['FEATURED_LISTING', 'FEATURED_RENEWAL'] },
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.featuredStatus !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Listing is not pending featured payment approval' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === 'approve') {
      // Check if listing is still ACTIVE
      if (listing.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Cannot activate featured promotion for inactive listing' },
          { status: 400 }
        );
      }

      // Determine if this is a new featured or renewal
      const isRenewal = listing.featuredExpiresAt !== null;
      const durationDays = isRenewal ? FEATURED_LISTING_RENEWAL_DAYS : FEATURED_LISTING_DURATION_DAYS;

      // Calculate new expiration: max(current_expiry, now) + duration days
      let baseDate = now;
      if (isRenewal && listing.featuredExpiresAt && listing.featuredExpiresAt > now) {
        baseDate = listing.featuredExpiresAt;
      }
      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);

      // Update listing
      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          featuredStatus: 'ACTIVE',
          featured: true,
          featuredStartAt: isRenewal ? listing.featuredStartAt : now,
          featuredExpiresAt: newExpiresAt,
        },
      });

      // Update payment record if exists
      if (listing.feePayments[0]) {
        await prisma.feePayment.update({
          where: { id: listing.feePayments[0].id },
          data: {
            status: 'VERIFIED',
            verifiedBy: session.user.id,
            verifiedAt: now,
            adminNotes: adminNotes || null,
          },
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'LISTING_APPROVED',
          title: isRenewal ? 'Featured Listing Renewed' : 'Featured Listing Activated',
          message: isRenewal
            ? `Your featured listing "${listing.title}" has been renewed for ${durationDays} days!`
            : `Your listing "${listing.title}" is now featured for ${durationDays} days!`,
          linkUrl: `/dashboard/listings/${listing.id}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Featured listing ${isRenewal ? 'renewed' : 'activated'} for ${durationDays} days`,
        listing: updatedListing,
      });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          featuredStatus: 'NONE',
          featuredPrice: null,
          featuredPaymentProof: null,
          rejectionReason: reason,
        },
      });

      // Update payment record if exists
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
          type: 'LISTING_APPROVED',
          title: 'Featured Request Rejected',
          message: `Your featured listing request for "${listing.title}" was not approved. Reason: ${reason}`,
          linkUrl: `/dashboard/listings/${listing.id}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Featured listing request rejected',
        listing: updatedListing,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing featured listing:', error);
    return NextResponse.json({ error: 'Failed to manage featured listing' }, { status: 500 });
  }
}
