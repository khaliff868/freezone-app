import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/users/[id] - Get public user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        location: true,
        bio: true,
        avatar: true,
        verified: true,
        tier: true,
        createdAt: true,
        _count: {
          select: {
            listings: {
              where: { status: 'ACTIVE' }
            }
          }
        },
        listings: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            images: true,
            category: true,
            condition: true,
            listingType: true,
            location: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get completed transactions count
    const [completedSales, completedSwaps] = await Promise.all([
      prisma.listing.count({
        where: { userId, status: { in: ['SOLD', 'SWAPPED'] } }
      }),
      prisma.swapDeal.count({
        where: {
          swapOffer: {
            OR: [
              { fromUserId: userId },
              { toUserId: userId }
            ],
            status: 'COMPLETED'
          }
        }
      })
    ]);

    return NextResponse.json({
      ...user,
      stats: {
        activeListings: user._count.listings,
        completedSales,
        completedSwaps,
        totalTransactions: completedSales + completedSwaps,
        memberSince: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
