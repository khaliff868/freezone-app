// Featured Listings API - For Homepage Rotation Pool
// Returns up to 12 active featured listings for client-side rotation

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { FEATURED_LISTING_MAX_POOL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/featured-listings
 * Fetch active featured listings for homepage rotation
 * 
 * Returns up to 12 active featured listings that satisfy:
 * - status = ACTIVE (listing is active)
 * - featuredStatus = ACTIVE (featured promotion is active)
 * - featuredExpiresAt > now (featured promotion hasn't expired)
 * 
 * The client handles 5-minute rotation displaying 6 at a time
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // First, expire any featured listings that have passed their expiration date
    await prisma.listing.updateMany({
      where: {
        featuredStatus: 'ACTIVE',
        featuredExpiresAt: {
          lte: now,
        },
      },
      data: {
        featuredStatus: 'EXPIRED',
        featured: false,
      },
    });

    // Fetch active featured listings
    const featuredListings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        featuredStatus: 'ACTIVE',
        featuredExpiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true,
            verified: true,
          },
        },
      },
      orderBy: [
        { featuredStartAt: 'asc' }, // Oldest featured first for fair rotation
        { createdAt: 'desc' },
      ],
      take: FEATURED_LISTING_MAX_POOL,
    });

    return NextResponse.json({
      success: true,
      listings: featuredListings,
      total: featuredListings.length,
      maxPool: FEATURED_LISTING_MAX_POOL,
    });
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured listings' },
      { status: 500 }
    );
  }
}
