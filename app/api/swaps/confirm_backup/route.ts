// Confirm Swap Completion API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/swaps/[id]/confirm
 * Confirm swap completion (requires both users to confirm)
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

    // Fetch swap offer with deal
    const offer = await prisma.swapOffer.findUnique({
      where: { id },
      include: {
        swapDeal: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Swap offer not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the swap
    if (offer.fromUserId !== session.user.id && offer.toUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not part of this swap' },
        { status: 403 }
      );
    }

    // Check if offer is in ACCEPTED status
    if (offer.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'This swap is not in accepted status' },
        { status: 400 }
      );
    }

    if (!offer.swapDeal) {
      return NextResponse.json(
        { error: 'Swap deal not found' },
        { status: 404 }
      );
    }

    // Determine which user is confirming
    const isFromUser = offer.fromUserId === session.user.id;
    const confirmField = isFromUser ? 'confirmFromUser' : 'confirmToUser';

    // Update confirmation
    const updatedDeal = await prisma.swapDeal.update({
      where: { id: offer.swapDeal.id },
      data: {
        [confirmField]: true,
      },
    });

    // Check if both users have confirmed
    const bothConfirmed = updatedDeal.confirmFromUser && updatedDeal.confirmToUser;

    if (bothConfirmed) {
      // Complete the swap
      await prisma.$transaction([
        // Mark swap as completed
        prisma.swapOffer.update({
          where: { id },
          data: { status: 'COMPLETED' },
        }),
        // Update deal completion
        prisma.swapDeal.update({
          where: { id: offer.swapDeal.id },
          data: { completedAt: new Date() },
        }),
        // Mark both listings as SWAPPED
        prisma.listing.update({
          where: { id: offer.offeredListingId },
          data: { status: 'SWAPPED', soldAt: new Date() },
        }),
        prisma.listing.update({
          where: { id: offer.requestedListingId },
          data: { status: 'SWAPPED', soldAt: new Date() },
        }),
      ]);

      return NextResponse.json({
        message: 'Swap completed successfully!',
        completed: true,
      });
    } else {
      return NextResponse.json({
        message: 'Confirmation recorded. Waiting for other user to confirm.',
        completed: false,
        deal: updatedDeal,
      });
    }
  } catch (error) {
    console.error('Error confirming swap:', error);
    return NextResponse.json(
      { error: 'Failed to confirm swap' },
      { status: 500 }
    );
  }
}
