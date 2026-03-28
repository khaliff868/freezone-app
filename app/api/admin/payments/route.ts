// Admin API - Payment Management
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Post-filter in JS: show payments where linked listing is in a
    // payment-relevant status (PENDING_PAYMENT, PENDING_APPROVAL, or ACTIVE),
    // or it's a banner/standalone payment with no listing FK.
    const filtered = payments.filter(p => {
      if (p.listingId && p.listing) {
        return ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE'].includes(p.listing.status);
      }
      return true;
    });

    return NextResponse.json({
      payments: filtered,
      pagination: { page, limit, total: filtered.length, pages: Math.ceil(filtered.length / limit) },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
