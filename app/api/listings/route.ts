// Listings API - List & Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { shouldResetMonthlyCounters } from '@/lib/tier-utils';
import {
  FREE_CATEGORY,
  PAID_LISTING_EXPIRY_DAYS,
  LISTING_FEE_AMOUNT
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be between 3 and 50 characters').max(50, 'Title must be between 3 and 50 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().min(1, 'Location is required'),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('TTD'),
  listingType: z.enum(['SELL', 'SWAP', 'BOTH', 'FREE']),
  swapTerms: z
    .string()
    .max(500, 'Swap terms cannot exceed 500 characters')
    .refine(val => val.length === 0 || val.length >= 3, {
      message: 'Swap terms must be at least 3 characters',
    })
    .nullable()
    .optional(),
  images: z.array(z.string()).max(8).default([]),
  plan: z.enum(['FEATURED', 'REGULAR']).optional(),
  series: z.string().max(30).nullable().optional(),
}).refine((data) => {
  if ((data.listingType === 'SELL' || data.listingType === 'BOTH') &&
      (data.price === null || data.price === undefined)) {
    return false;
  }
  return true;
}, {
  message: 'Price is required for paid listings',
  path: ['price'],
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const listingType = searchParams.get('type');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (listingType) where.listingType = listingType;
    if (category) where.category = category;
    if (location) where.location = location;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, tier: true, verified: true, location: true },
          },
        },
        orderBy: [{ featured: 'desc' }, { boosted: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validationResult = createListingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const isFeatured = data.plan === 'FEATURED';

    if (data.listingType === 'FREE') data.price = null;
    if (!data.swapTerms || data.swapTerms.trim().length === 0) data.swapTerms = null;
    if (data.listingType === 'SELL' || data.listingType === 'FREE') data.swapTerms = null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true, sellListingsThisMonth: true, monthlyResetAt: true, trialEndsAt: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (shouldResetMonthlyCounters(user.monthlyResetAt)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { sellListingsThisMonth: 0, monthlyResetAt: new Date() },
      });
    }

    const isFreeItemsCategory = data.category === FREE_CATEGORY;

    // Flow:
    // Free Items → PENDING_APPROVAL (admin approves → ACTIVE, no payment)
    // Paid/Featured → PENDING_PAYMENT (user pays first → admin verifies → admin approves → ACTIVE)
    const initialStatus = isFreeItemsCategory ? 'PENDING_APPROVAL' : 'PENDING_PAYMENT';
    const requiresPayment = !isFreeItemsCategory;

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        location: data.location,
        price: data.price ?? null,
        currency: data.currency,
        listingType: data.listingType,
        swapTerms: data.swapTerms ?? null,
        series: data.series ?? null,
        images: data.images,
        userId: session.user.id,
        status: initialStatus,
        featured: isFeatured,
        publishedAt: null,
        expiresAt: null,
      },
      include: { user: { select: { id: true, name: true, email: true, tier: true } } },
    });

    if (data.listingType === 'SELL' || data.listingType === 'BOTH') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { sellListingsThisMonth: { increment: 1 } },
      });
    }

    let message = 'Listing created! Submit payment to publish.';
    if (isFreeItemsCategory) {
      message = 'Listing submitted for admin approval. It will be visible once approved.';
    } else if (isFeatured) {
      message = 'Featured listing created! Submit payment to publish.';
    }

    return NextResponse.json(
      { message, listing, requiresPayment, paymentAmount: requiresPayment ? LISTING_FEE_AMOUNT : 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
