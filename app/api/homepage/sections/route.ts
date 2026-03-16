import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ListingWithUser = {
  id: string;
  featured: boolean;
  listingType: string;
  category: string;
  views: number;
  createdAt: Date;
  [key: string]: any;
};

export async function GET(request: NextRequest) {
  try {
    // Fetch all active listings in a single query
    const allListings: ListingWithUser[] = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, avatar: true, location: true, verified: true } } },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    // 1. Featured Listings (is_featured = true, limit 6, fill with newest if needed)
    let featuredListings = allListings.filter((l: ListingWithUser) => l.featured).slice(0, 6);
    if (featuredListings.length < 6) {
      const featuredIds = new Set(featuredListings.map((l: ListingWithUser) => l.id));
      const additional = allListings.filter((l: ListingWithUser) => !featuredIds.has(l.id)).slice(0, 6 - featuredListings.length);
      featuredListings = [...featuredListings, ...additional];
    }

    // 2. Latest Listings (newest, limit 8)
    const latestListings = allListings.slice(0, 8);

    // 3. Suggested Swap Matches (listingType SWAP or BOTH, limit 6)
    let swapListings = allListings.filter((l: ListingWithUser) => l.listingType === 'SWAP' || l.listingType === 'BOTH').slice(0, 6);
    if (swapListings.length < 6) {
      const swapIds = new Set(swapListings.map((l: ListingWithUser) => l.id));
      const additional = allListings.filter((l: ListingWithUser) => !swapIds.has(l.id)).slice(0, 6 - swapListings.length);
      swapListings = [...swapListings, ...additional];
    }

    // 4. Trending Listings (by views, then newest, limit 6)
    const trendingListings = [...allListings].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);

    // 5. Popular Categories (with counts, limit 8) - derived from listings
    const categoryMap: Record<string, number> = {};
    allListings.forEach((l: ListingWithUser) => {
      categoryMap[l.category] = (categoryMap[l.category] || 0) + 1;
    });
    const popularCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // 6. Recent Marketplace Activity (limit 6) - derived from listings
    const recentActivity = allListings.slice(0, 6).map((l: ListingWithUser) => ({
      type: 'new_listing',
      message: `New listing posted in ${l.category}`,
      timestamp: l.createdAt,
    }));

    // 7. Recommended For You (randomized, limit 6)
    const shuffled = [...allListings].sort(() => Math.random() - 0.5);
    const recommendedListings = shuffled.slice(0, 6);

    return NextResponse.json({
      success: true,
      data: {
        featured: featuredListings,
        latest: latestListings,
        swapMatches: swapListings,
        trending: trendingListings,
        popularCategories,
        recentActivity,
        recommended: recommendedListings,
      },
    });
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homepage sections' },
      { status: 500 }
    );
  }
}
