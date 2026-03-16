// Admin API - Dashboard Statistics

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get listing counts by status
    const listingsByStatus = await prisma.listing.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get listing counts by type
    const listingsByType = await prisma.listing.groupBy({
      by: ['listingType'],
      _count: true,
    });

    // Get total revenue from posting fees
    const revenueData = await prisma.feePayment.aggregate({
      where: {
        status: { in: ['PAID', 'VERIFIED'] },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get pending bank deposits
    const pendingDeposits = await prisma.feePayment.count({
      where: {
        method: 'BANK_DEPOSIT',
        status: 'PENDING',
      },
    });

    // Get recent activity (last 10 listings)
    const recentListings = await prisma.listing.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get recent payments (last 10)
    const recentPayments = await prisma.feePayment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get swap statistics
    const swapStats = await prisma.swapOffer.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
      },
      listings: {
        byStatus: listingsByStatus,
        byType: listingsByType,
      },
      revenue: {
        total: revenueData._sum.amount || 0,
        transactions: revenueData._count,
      },
      pendingDeposits,
      recentListings,
      recentPayments,
      swaps: {
        byStatus: swapStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
