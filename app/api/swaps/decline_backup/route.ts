// Decline Swap Offer API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/swaps/[id]/decline
 * Decline a swap offer
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
        { error: 'Only the recipient can decline this offer' },
        { status: 403 }
      );
    }

    // Check if offer is in OFFERED status
    if (offer.status !== 'OFFERED') {
      return NextResponse.json(
        { error: 'This offer cannot be declined' },
        { status: 400 }
      );
    }

    // Update offer status
    const updatedOffer = await prisma.swapOffer.update({
      where: { id },
      data: {
        status: 'DECLINED',
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
    });

    return NextResponse.json({
      message: 'Swap offer declined',
      offer: updatedOffer,
    });
  } catch (error) {
    console.error('Error declining swap offer:', error);
    return NextResponse.json(
      { error: 'Failed to decline swap offer' },
      { status: 500 }
    );
  }
}
