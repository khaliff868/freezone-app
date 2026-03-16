import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const listingType = searchParams.get('type') || '';
    const condition = searchParams.get('condition') || '';
    const location = searchParams.get('location') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
    };

    // Full-text search on title and description
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Listing type filter
    if (listingType && ['SELL', 'SWAP', 'BOTH'].includes(listingType)) {
      where.listingType = listingType as 'SELL' | 'SWAP' | 'BOTH';
    }

    // Condition filter
    if (condition && ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'].includes(condition)) {
      where.condition = condition as 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get total count for pagination
    const totalCount = await prisma.listing.count({ where });

    // Fetch listings
    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true, location: true },
        },
      },
      orderBy: [{ featured: 'desc' }, { boosted: 'desc' }, orderBy],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get available categories for filters
    const categories = await prisma.listing.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: { category: true },
    });

    // Get available locations for filters
    const locations = await prisma.listing.groupBy({
      by: ['location'],
      where: { status: 'ACTIVE' },
      _count: { location: true },
    });

    return NextResponse.json({
      listings,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        categories: categories.map((c: { category: string; _count: { category: number } }) => ({ name: c.category, count: c._count.category })),
        locations: locations.map((l: { location: string; _count: { location: number } }) => ({ name: l.location, count: l._count.location })),
      },
    });
  } catch (error) {
    console.error('Error searching listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
