// Featured Listing API - Request, Pay, and Renew Featured Promotions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  FEATURED_LISTING_PRICE,
  FEATURED_LISTING_DURATION_DAYS,
  FEATURED_LISTING_RENEWAL_PRICE,
  FEATURED_LISTING_RENEWAL_DAYS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/listings/[id]/featured
 * Get featured status for a listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        featuredStatus: true,
        featuredStartAt: true,
        featuredExpiresAt: true,
        featuredPrice: true,
        featuredPaymentProof: true,
        featured: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const now = new Date();
    const isExpired = listing.featuredExpiresAt && listing.featuredExpiresAt <= now;

    return NextResponse.json({
      success: true,
      featuredStatus: listing.featuredStatus,
      featuredStartAt: listing.featuredStartAt,
      featuredExpiresAt: listing.featuredExpiresAt,
      featuredPrice: listing.featuredPrice,
      isExpired,
      canRenew: listing.featuredStatus === 'EXPIRED' || (listing.featuredStatus === 'ACTIVE' && isExpired),
      renewalPrice: FEATURED_LISTING_RENEWAL_PRICE,
      renewalDays: FEATURED_LISTING_RENEWAL_DAYS,
    });
  } catch (error) {
    console.error('Error getting featured status:', error);
    return NextResponse.json({ error: 'Failed to get featured status' }, { status: 500 });
  }
}

/**
 * POST /api/listings/[id]/featured
 * Request to make a listing featured or renew featured status
 * 
 * Body:
 * - action: 'request' | 'renew'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'request' } = body;

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify ownership
    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only manage your own listings' }, { status: 403 });
    }

    // Listing must be ACTIVE to be featured
    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active listings can be featured. Please ensure your listing is active first.' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === 'request') {
      // New featured request
      if (listing.featuredStatus === 'ACTIVE' && listing.featuredExpiresAt && listing.featuredExpiresAt > now) {
        return NextResponse.json(
          { error: 'This listing is already featured and active.' },
          { status: 400 }
        );
      }

      if (listing.featuredStatus === 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: 'A featured request is already pending payment. Please submit payment proof.' },
          { status: 400 }
        );
      }

      // Set featured status to pending payment
      const updatedListing = await prisma.listing.update({
        where: { id: params.id },
        data: {
          featuredStatus: 'PENDING_PAYMENT',
          featuredPrice: FEATURED_LISTING_PRICE,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Featured listing request submitted. Please submit payment of ${FEATURED_LISTING_PRICE} TTD.`,
        listing: {
          id: updatedListing.id,
          featuredStatus: updatedListing.featuredStatus,
          featuredPrice: updatedListing.featuredPrice,
        },
        requiresPayment: true,
        paymentAmount: FEATURED_LISTING_PRICE,
        duration: FEATURED_LISTING_DURATION_DAYS,
      });
    }

    if (action === 'renew') {
      // Renewal request
      const isExpired = listing.featuredExpiresAt && listing.featuredExpiresAt <= now;
      
      if (listing.featuredStatus === 'NONE') {
        return NextResponse.json(
          { error: 'This listing has never been featured. Use the request action instead.' },
          { status: 400 }
        );
      }

      if (listing.featuredStatus === 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: 'A featured payment is already pending. Please submit payment proof.' },
          { status: 400 }
        );
      }

      if (listing.featuredStatus === 'ACTIVE' && !isExpired) {
        return NextResponse.json(
          { error: 'Featured listing is still active. You can renew when it expires or close to expiration.' },
          { status: 400 }
        );
      }

      // Set featured status to pending payment for renewal
      const updatedListing = await prisma.listing.update({
        where: { id: params.id },
        data: {
          featuredStatus: 'PENDING_PAYMENT',
          featuredPrice: FEATURED_LISTING_RENEWAL_PRICE,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Featured renewal request submitted. Please submit payment of ${FEATURED_LISTING_RENEWAL_PRICE} TTD.`,
        listing: {
          id: updatedListing.id,
          featuredStatus: updatedListing.featuredStatus,
          featuredPrice: updatedListing.featuredPrice,
        },
        requiresPayment: true,
        paymentAmount: FEATURED_LISTING_RENEWAL_PRICE,
        duration: FEATURED_LISTING_RENEWAL_DAYS,
        isRenewal: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing featured request:', error);
    return NextResponse.json({ error: 'Failed to process featured request' }, { status: 500 });
  }
}

/**
 * PUT /api/listings/[id]/featured
 * Submit payment proof for featured listing
 * 
 * Body:
 * - paymentProofUrl: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentProofUrl } = body;

    if (!paymentProofUrl) {
      return NextResponse.json({ error: 'Payment proof URL is required' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only manage your own listings' }, { status: 403 });
    }

    if (listing.featuredStatus !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'This listing is not pending featured payment' },
        { status: 400 }
      );
    }

    // Update with payment proof
    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: {
        featuredPaymentProof: paymentProofUrl,
      },
    });

    // Create a fee payment record for tracking
    await prisma.feePayment.create({
      data: {
        listingId: params.id,
        userId: session.user.id,
        purpose: listing.featuredExpiresAt ? 'FEATURED_RENEWAL' : 'FEATURED_LISTING',
        amount: listing.featuredPrice || FEATURED_LISTING_PRICE,
        currency: 'TTD',
        method: 'BANK_DEPOSIT',
        status: 'PENDING',
        proofUploadUrl: paymentProofUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted. Your featured listing will be activated once admin verifies the payment.',
      listing: {
        id: updatedListing.id,
        featuredStatus: updatedListing.featuredStatus,
      },
    });
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ error: 'Failed to submit payment proof' }, { status: 500 });
  }
}
