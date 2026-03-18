// Listings API - Get, Update, Delete Single Listing

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
  location: z.string().optional(),
  price: z.number().positive().nullable().optional(),
  currency: z.string().optional(),
  listingType: z.enum(['SELL', 'SWAP', 'BOTH', 'FREE']).optional(),
  swapTerms: z.string().nullable().optional(),
  images: z.array(z.string()).max(8).optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'REJECTED', 'SOLD', 'SWAPPED', 'REMOVED']).optional(),
});

/**
 * GET /api/listings/[id]
 * Get single listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
            verified: true,
            location: true,
            phone: true,
            whatsapp: true,
          },
        },
        feePayments: {
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

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/listings/[id]
 * Update listing
 */
export async function PATCH(
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
    const body = await request.json();

    const validationResult = updateListingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/listings/[id]
 * Full update of listing (used by edit page) - owner only
 */
export async function PUT(
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
    const body = await request.json();

    const validationResult = updateListingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only the listing owner can edit this listing' },
        { status: 403 }
      );
    }

    const { status: _status, ...safeData } = data;

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: safeData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]
 * Delete listing (soft delete by setting status to REMOVED)
 */
export async function DELETE(
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

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        offeredInSwaps: {
          where: {
            status: { in: ['OFFERED', 'ACCEPTED'] },
          },
        },
        requestedInSwaps: {
          where: {
            status: { in: ['OFFERED', 'ACCEPTED'] },
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

    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (listing.offeredInSwaps.length > 0 || listing.requestedInSwaps.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete listing with active swap offers' },
        { status: 400 }
      );
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'REMOVED' },
    });

    return NextResponse.json({
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
