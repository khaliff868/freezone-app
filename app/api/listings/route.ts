// Listings API - List & Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { shouldResetMonthlyCounters } from '@/lib/tier-utils';
import { 
  FREE_CATEGORY, 
  FREE_ITEMS_EXPIRY_DAYS, 
  PAID_LISTING_EXPIRY_DAYS,
  LISTING_FEE_AMOUNT 
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().min(1, 'Location is required'),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('TTD'),
  listingType: z.enum(['SELL', 'SWAP', 'BOTH', 'FREE']),
  swapTerms: z.string().optional(),
  images: z.array(z.string()).max(8).default([]),
}).refine((data) => {
  // Price is required for SELL and BOTH listing types
  if ((data.listingType === 'SELL' || data.listingType === 'BOTH') && 
      (data.price === null || data.price === undefined)) {
    return false;
  }
  return true;
}, {
  message: 'Price is required for paid listings',
  path: ['price'],
});

/**
 * GET /api/listings
 * List listings with filters
 */
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

    if (status) {
      where.status = status;
    }

    if (listingType) {
      where.listingType = listingType;
    }

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = location;
    }

    if (userId) {
      where.userId = userId;
    }

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
            select: {
              id: true,
              name: true,
              email: true,
              tier: true,
              verified: true,
              location: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { boosted: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings
 * Create new listing
 * 
 * Monetization Logic:
 * 1. Free Items category: Always free, requires admin approval (PENDING_APPROVAL)
 * 2. Paid listings during trial: Publish immediately (ACTIVE)
 * 3. Paid listings after trial: Require payment (PENDING_PAYMENT)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createListingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // For FREE listings, ensure price is null
    if (data.listingType === 'FREE') {
      data.price = null;
    }

    // Fetch user with tier and trial info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tier: true,
        sellListingsThisMonth: true,
        monthlyResetAt: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Reset monthly counters if needed
    let sellListingsCount = user.sellListingsThisMonth;
    if (shouldResetMonthlyCounters(user.monthlyResetAt)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          sellListingsThisMonth: 0,
          monthlyResetAt: new Date(),
        },
      });
      sellListingsCount = 0;
    }

    // Determine listing status based on category and trial
    const isFreeItemsCategory = data.category === FREE_CATEGORY;
    const now = new Date();
    
    // Calculate if user is in trial period
    // If trialEndsAt exists, use it; otherwise calculate from createdAt
    let trialEndsAt = user.trialEndsAt;
    if (!trialEndsAt && user.createdAt) {
      // Legacy users without trialEndsAt - calculate from createdAt
      trialEndsAt = new Date(user.createdAt);
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    }
    const isInTrial = trialEndsAt ? now < trialEndsAt : false;

    let initialStatus: 'PENDING_APPROVAL' | 'PENDING_PAYMENT' | 'ACTIVE';
    let publishedAt: Date | null = null;
    let expiresAt: Date | null = null;
    let requiresPayment = false;

    if (isFreeItemsCategory) {
      // Free Items: Always free, always requires admin approval
      initialStatus = 'PENDING_APPROVAL';
      // publishedAt and expiresAt will be set when admin approves
    } else if (isInTrial) {
      // During trial: Paid listings publish immediately
      initialStatus = 'ACTIVE';
      publishedAt = now;
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + PAID_LISTING_EXPIRY_DAYS);
    } else {
      // After trial: Paid listings require payment
      initialStatus = 'PENDING_PAYMENT';
      requiresPayment = true;
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        ...data,
        userId: session.user.id,
        status: initialStatus,
        publishedAt,
        expiresAt,
        activatedAt: initialStatus === 'ACTIVE' ? now : undefined,
      },
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

    // Increment sell listings counter if SELL or BOTH
    if (data.listingType === 'SELL' || data.listingType === 'BOTH') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          sellListingsThisMonth: { increment: 1 },
        },
      });
    }

    // Prepare response message based on status
    let message = 'Listing created successfully';
    if (initialStatus === 'PENDING_APPROVAL') {
      message = 'Listing submitted for admin approval. It will be visible once approved.';
    } else if (initialStatus === 'PENDING_PAYMENT') {
      message = `Listing created. Payment of ${LISTING_FEE_AMOUNT} TTD required to publish.`;
    }

    return NextResponse.json(
      {
        message,
        listing,
        requiresPayment,
        paymentAmount: requiresPayment ? LISTING_FEE_AMOUNT : 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
