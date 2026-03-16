// Listing Publish API - Transition from DRAFT to appropriate status

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { FREE_CATEGORY, LISTING_FEE_AMOUNT, FREE_ITEMS_EXPIRY_DAYS, PAID_LISTING_EXPIRY_DAYS, TRIAL_DURATION_DAYS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/listings/[id]/publish
 * Transition listing from DRAFT to PENDING_APPROVAL, PENDING_PAYMENT, or ACTIVE
 * - Free Items → PENDING_APPROVAL (admin review)
 * - Paid listings during trial → ACTIVE immediately
 * - Paid listings after trial → PENDING_PAYMENT (100 TTD required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch listing with user info
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            tier: true,
            trialEndsAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if listing is in DRAFT status
    if (listing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Listing is not in DRAFT status' },
        { status: 400 }
      );
    }

    const now = new Date();
    let newStatus: 'PENDING_APPROVAL' | 'PENDING_PAYMENT' | 'ACTIVE';
    let requiresPayment = false;
    let paymentAmount = 0;
    let expiresAt: Date | undefined;
    let publishedAt: Date | undefined;

    if (listing.category === FREE_CATEGORY) {
      // Free Items require admin approval, no payment
      newStatus = 'PENDING_APPROVAL';
    } else {
      // Check if user is still in trial period
      const trialEndsAt = listing.user.trialEndsAt || 
        new Date(listing.user.createdAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
      const isInTrial = now < trialEndsAt;

      if (isInTrial) {
        // During trial, paid listings go ACTIVE immediately
        newStatus = 'ACTIVE';
        publishedAt = now;
        expiresAt = new Date(now.getTime() + PAID_LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      } else {
        // After trial, requires payment
        newStatus = 'PENDING_PAYMENT';
        requiresPayment = true;
        paymentAmount = LISTING_FEE_AMOUNT;
      }
    }

    // Update listing status
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt,
        expiresAt,
      },
    });

    return NextResponse.json({
      message: newStatus === 'PENDING_APPROVAL' 
        ? 'Listing submitted for admin approval'
        : requiresPayment 
          ? 'Listing pending payment' 
          : 'Listing published successfully',
      listing: updatedListing,
      requiresPayment,
      paymentAmount,
    });
  } catch (error) {
    console.error('Error publishing listing:', error);
    return NextResponse.json(
      { error: 'Failed to publish listing' },
      { status: 500 }
    );
  }
}
