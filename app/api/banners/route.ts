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

        // Only show active + enabled banners
        active: true,

        // Ensure banner is within valid date range
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }, // fallback ordering
      ],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
      },
    });

    // Increment impressions safely
    if (banners.length > 0) {
      await prisma.bannerAd.updateMany({
        where: {
          id: { in: banners.map((b) => b.id) },
        },
        data: {
          impressions: { increment: 1 },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ banners: [] });
  }
}
