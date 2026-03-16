import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');

    if (!placement) {
      return NextResponse.json({ banners: [] });
    }

    const now = new Date();
    const banners = await prisma.bannerAd.findMany({
      where: {
        placement,
        status: 'ACTIVE',
        // Check if within active date range
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
      },
    });

    // Increment impressions for all returned banners
    if (banners.length > 0) {
      await prisma.bannerAd.updateMany({
        where: { id: { in: banners.map((b: { id: string }) => b.id) } },
        data: { impressions: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ banners: [] });
  }
}
