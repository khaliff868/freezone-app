import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET swap offers for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent' | 'received' | 'all'

    let whereClause: any = {};
    if (type === 'sent') {
      whereClause = { fromUserId: session.user.id };
    } else if (type === 'received') {
      whereClause = { toUserId: session.user.id };
    } else {
      whereClause = {
        OR: [
          { fromUserId: session.user.id },
          { toUserId: session.user.id },
        ],
      };
    }

    const swapOffers = await prisma.swapOffer.findMany({
      where: whereClause,
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
        offeredListing: {
          select: { id: true, title: true, images: true, category: true, price: true, condition: true },
        },
        requestedListing: {
          select: { id: true, title: true, images: true, category: true, price: true, condition: true },
        },
        swapDeal: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(swapOffers);
  } catch (error) {
    console.error('Error fetching swap offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new swap offer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offeredListingId, requestedListingId, message } = body;

    if (!offeredListingId || !requestedListingId) {
      return NextResponse.json(
        { error: 'Both offered and requested listing IDs are required' },
        { status: 400 }
      );
    }

    // Verify offered listing belongs to current user and is swappable
    const offeredListing = await prisma.listing.findFirst({
      where: {
        id: offeredListingId,
        userId: session.user.id,
        status: 'ACTIVE',
        listingType: { in: ['SWAP', 'BOTH'] },
      },
    });

    if (!offeredListing) {
      return NextResponse.json(
        { error: 'Offered listing not found or not available for swap' },
        { status: 400 }
      );
    }

    // Verify requested listing exists and is swappable
    const requestedListing = await prisma.listing.findFirst({
      where: {
        id: requestedListingId,
        status: 'ACTIVE',
        listingType: { in: ['SWAP', 'BOTH'] },
      },
      include: { user: true },
    });

    if (!requestedListing) {
      return NextResponse.json(
        { error: 'Requested listing not found or not available for swap' },
        { status: 400 }
      );
    }

    if (requestedListing.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot swap with your own listing' },
        { status: 400 }
      );
    }

    // Check for existing pending offer
    const existingOffer = await prisma.swapOffer.findFirst({
      where: {
        offeredListingId,
        requestedListingId,
        status: 'OFFERED',
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: 'A pending swap offer already exists for these listings' },
        { status: 400 }
      );
    }

    const swapOffer = await prisma.swapOffer.create({
      data: {
        fromUserId: session.user.id,
        toUserId: requestedListing.userId,
        offeredListingId,
        requestedListingId,
        message: message || null,
      },
      include: {
        offeredListing: true,
        requestedListing: true,
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: requestedListing.userId,
        type: 'SWAP_OFFER',
        title: 'New Swap Offer',
        message: `${session.user.name} wants to swap "${offeredListing.title}" for your "${requestedListing.title}"`,
        linkUrl: `/dashboard/swaps`,
      },
    });

    return NextResponse.json(swapOffer);
  } catch (error) {
    console.error('Error creating swap offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
