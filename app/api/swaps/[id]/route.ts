import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET single swap offer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const swapOffer = await prisma.swapOffer.findFirst({
      where: {
        id: params.id,
        OR: [
          { fromUserId: session.user.id },
          { toUserId: session.user.id },
        ],
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true, phone: true } },
        toUser: { select: { id: true, name: true, avatar: true, phone: true } },
        offeredListing: true,
        requestedListing: true,
        swapDeal: true,
      },
    });

    if (!swapOffer) {
      return NextResponse.json({ error: 'Swap offer not found' }, { status: 404 });
    }

    return NextResponse.json(swapOffer);
  } catch (error) {
    console.error('Error fetching swap offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update swap offer status (accept/decline/cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'accept' | 'decline' | 'cancel'

    const swapOffer = await prisma.swapOffer.findFirst({
      where: {
        id: params.id,
        OR: [
          { fromUserId: session.user.id },
          { toUserId: session.user.id },
        ],
      },
      include: {
        fromUser: true,
        toUser: true,
        offeredListing: true,
        requestedListing: true,
      },
    });

    if (!swapOffer) {
      return NextResponse.json({ error: 'Swap offer not found' }, { status: 404 });
    }

    if (swapOffer.status !== 'OFFERED') {
      return NextResponse.json(
        { error: 'This swap offer has already been processed' },
        { status: 400 }
      );
    }

    let updatedOffer;
    let notificationData;

    switch (action) {
      case 'accept':
        // Only recipient can accept
        if (swapOffer.toUserId !== session.user.id) {
          return NextResponse.json(
            { error: 'Only the recipient can accept this offer' },
            { status: 403 }
          );
        }

        updatedOffer = await prisma.swapOffer.update({
          where: { id: params.id },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
          },
        });

        // Create swap deal
        await prisma.swapDeal.create({
          data: {
            swapOfferId: params.id,
          },
        });

        // Mark both listings as swapped
        await prisma.listing.updateMany({
          where: {
            id: { in: [swapOffer.offeredListingId, swapOffer.requestedListingId] },
          },
          data: { status: 'SWAPPED' },
        });

        notificationData = {
          userId: swapOffer.fromUserId,
          type: 'SWAP_ACCEPTED' as const,
          title: 'Swap Accepted! 🎉',
          message: `${swapOffer.toUser.name} accepted your swap offer for "${swapOffer.requestedListing.title}"`,
          linkUrl: `/dashboard/swaps`,
        };
        break;

      case 'decline':
        // Only recipient can decline
        if (swapOffer.toUserId !== session.user.id) {
          return NextResponse.json(
            { error: 'Only the recipient can decline this offer' },
            { status: 403 }
          );
        }

        updatedOffer = await prisma.swapOffer.update({
          where: { id: params.id },
          data: {
            status: 'DECLINED',
            respondedAt: new Date(),
          },
        });

        notificationData = {
          userId: swapOffer.fromUserId,
          type: 'SWAP_DECLINED' as const,
          title: 'Swap Declined',
          message: `${swapOffer.toUser.name} declined your swap offer for "${swapOffer.requestedListing.title}"`,
          linkUrl: `/dashboard/swaps`,
        };
        break;

      case 'cancel':
        // Only sender can cancel
        if (swapOffer.fromUserId !== session.user.id) {
          return NextResponse.json(
            { error: 'Only the sender can cancel this offer' },
            { status: 403 }
          );
        }

        updatedOffer = await prisma.swapOffer.update({
          where: { id: params.id },
          data: {
            status: 'CANCELLED',
            respondedAt: new Date(),
          },
        });

        notificationData = {
          userId: swapOffer.toUserId,
          type: 'SWAP_DECLINED' as const,
          title: 'Swap Cancelled',
          message: `${swapOffer.fromUser.name} cancelled their swap offer for "${swapOffer.requestedListing.title}"`,
          linkUrl: `/dashboard/swaps`,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create notification
    if (notificationData) {
      await prisma.notification.create({ data: notificationData });
    }

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error('Error updating swap offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
