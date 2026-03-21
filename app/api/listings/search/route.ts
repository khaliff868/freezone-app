export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
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

    const where: any = {
      status: 'ACTIVE',
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Use startsWith for House & Land to match all subcategories
    if (category) {
      if (category === 'House & Land') {
        where.category = { startsWith: 'House & Land' };
      } else {
        where.category = category;
      }
    }

    if (listingType && ['SELL', 'SWAP', 'BOTH'].includes(listingType)) {
      where.listingType = listingType as 'SELL' | 'SWAP' | 'BOTH';
    }

    if (condition && ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'].includes(condition)) {
      where.condition = condition as 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    let orderBy: any = {};
    switch (sortBy) {
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'price_low': orderBy = { price: 'asc' }; break;
      case 'price_high': orderBy = { price: 'desc' }; break;
      case 'popular': orderBy = { views: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    const totalCount = await prisma.listing.count({ where });

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

    // Roll up House & Land subcategories into one count
    const rawCategories = await prisma.listing.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: { category: true },
    });

    const categoryMap: Record<string, number> = {};
    for (const c of rawCategories) {
      const key = c.category.startsWith('House & Land') ? 'House & Land' : c.category;
      categoryMap[key] = (categoryMap[key] || 0) + c._count.category;
    }
    const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

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
        categories,
        locations: locations.map((l: { location: string; _count: { location: number } }) => ({
          name: l.location,
          count: l._count.location,
        })),
      },
    });
  } catch (error) {
    console.error('Error searching listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
