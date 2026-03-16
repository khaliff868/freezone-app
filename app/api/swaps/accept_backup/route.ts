// Accept Swap Offer API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/swaps/[id]/accept
 * Accept a swap offer
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

    // Fetch swap offer
    const offer = await prisma.swapOffer.findUnique({
      where: { id },
      include: {
        offeredListing: true,
        requestedListing: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Swap offer not found' },
        { status: 404 }
      );
    }

    // Verify user is the recipient
    if (offer.toUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the recipient can accept this offer' },
        { status: 403 }
      );
    }

    // Check if offer is in OFFERED status
    if (offer.status !== 'OFFERED') {
      return NextResponse.json(
        { error: 'This offer cannot be accepted' },
        { status: 400 }
      );
    }

    // Verify both listings are still ACTIVE
    if (offer.offeredListing.status !== 'ACTIVE' || offer.requestedListing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'One or both listings are no longer available' },
        { status: 400 }
      );
    }

    // Update offer status and create swap deal
    const [updatedOffer] = await prisma.$transaction([
      prisma.swapOffer.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          offeredListing: true,
          requestedListing: true,
        },
      }),
      prisma.swapDeal.create({
        data: {
          swapOfferId: id,
          confirmFromUser: false,
          confirmToUser: false,
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Swap offer accepted successfully',
      offer: updatedOffer,
    });
  } catch (error) {
    console.error('Error accepting swap offer:', error);
    return NextResponse.json(
      { error: 'Failed to accept swap offer' },
      { status: 500 }
    );
  }
}
