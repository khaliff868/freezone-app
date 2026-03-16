// Listing Renewal API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  FREE_CATEGORY, 
  LISTING_FEE_AMOUNT 
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/listings/[id]/renew
 * Initiate listing renewal
 * 
 * For Free Items: Status becomes PENDING_APPROVAL (free renewal)
 * For Paid Listings: Status becomes PENDING_PAYMENT (requires 100 TTD)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const listingId = params.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only renew your own listings' },
        { status: 403 }
      );
    }

    // Can only renew ACTIVE or EXPIRED listings
    if (!['ACTIVE', 'EXPIRED'].includes(listing.status)) {
      return NextResponse.json(
        { error: 'This listing cannot be renewed in its current state' },
        { status: 400 }
      );
    }

    const isFreeItems = listing.category === FREE_CATEGORY;

    if (isFreeItems) {
      // Free Items renewal: Free but requires admin approval
      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'PENDING_APPROVAL',
        },
      });

      return NextResponse.json({
        message: 'Renewal request submitted for admin approval.',
        listing: updatedListing,
        requiresPayment: false,
      });
    } else {
      // Paid listing renewal: Requires 100 TTD payment
      const updatedListing = await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'PENDING_PAYMENT',
        },
      });

      return NextResponse.json({
        message: `Renewal initiated. Payment of ${LISTING_FEE_AMOUNT} TTD required.`,
        listing: updatedListing,
        requiresPayment: true,
        paymentAmount: LISTING_FEE_AMOUNT,
      });
    }
  } catch (error) {
    console.error('Error renewing listing:', error);
    return NextResponse.json(
      { error: 'Failed to renew listing' },
      { status: 500 }
    );
  }
}
