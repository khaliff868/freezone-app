import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateListingSchema = z.object({
  title: z.string().min(3).max(50).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.string().min(1).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
  location: z.string().min(1).optional(),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  listingType: z.enum(['SELL', 'SWAP', 'BOTH', 'FREE']).optional(),
  swapTerms: z.string().max(500).nullable().optional(),
  images: z.array(z.string()).max(8).optional(),
  status: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, tier: true,
            verified: true, location: true, phone: true, whatsapp: true, createdAt: true,
          },
        },
        feePayments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    await prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } });
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const isOwner = listing.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validationResult = updateListingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, tier: true,
            verified: true, location: true, phone: true, whatsapp: true, createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const isOwner = listing.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id } });

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
