// Expiration Cron Job API
// Marks listings and banner ads as expired when their expiration date passes

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Security: Add a secret key to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET || 'default-cron-secret';

/**
 * POST /api/cron/expire
 * Daily job to mark expired listings and banner ads
 * Should be called by a cron service with the correct secret
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    let listingsExpired = 0;
    let bannersExpired = 0;

    // Expire listings where expiresAt < now and status is ACTIVE
    const expiredListings = await prisma.listing.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    listingsExpired = expiredListings.count;

    // Expire banner ads where endsAt < now and status is ACTIVE
    const expiredBanners = await prisma.bannerAd.updateMany({
      where: {
        status: 'ACTIVE',
        endsAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
        active: false,
      },
    });
    bannersExpired = expiredBanners.count;

    console.log(`[Cron] Expired ${listingsExpired} listings and ${bannersExpired} banner ads at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Expired ${listingsExpired} listings and ${bannersExpired} banner ads`,
      listingsExpired,
      bannersExpired,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error running expiration cron:', error);
    return NextResponse.json(
      { error: 'Failed to run expiration job' },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (admin only)
export async function GET(request: NextRequest) {
  // This can be used for testing in dev environment
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Forward to POST handler
  return POST(request);
}
