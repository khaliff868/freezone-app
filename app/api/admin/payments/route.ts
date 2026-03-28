// Admin API - Payment Management
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments
 * Returns payments where the related listing has been submitted for payment
 * (status = PENDING_PAYMENT, PENDING_APPROVAL, or ACTIVE).
 * All three statuses are valid for payment verification.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (method) where.method = method;
    if (status) where.status = status;
    if (userId) where.userId = userId;

    // Only show payments where:
    // - The linked listing is in PENDING_PAYMENT, PENDING_APPROVAL, or ACTIVE
    //   (all states where payment verification is relevant)
    //   OR
    // - The linked banner has been content-approved
    //   OR
    // - It is a standalone payment (no listing, no banner)
    where.OR = [
      // Listing payments — show for all payment-relevant statuses
      {
        listingId: { not: null },
        bannerAdId: null,
        listing: {
          status: { in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE'] },
        },
      },
      // Banner ad payments — only show if banner is content-approved
      {
        bannerAdId: { not: null },
        listingId: null,
        bannerAd: {
          status: { in: ['PENDING_PAYMENT', 'ACTIVE', 'PENDING_VERIFICATION'] },
        },
      },
      // Payments with no linked listing or banner (edge case)
      {
        listingId: null,
        bannerAdId: null,
      },
    ];

    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, tier: true },
          },
          listing: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feePayment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
