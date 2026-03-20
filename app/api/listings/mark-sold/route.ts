import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing listing ID' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'SOLD', soldAt: new Date() },
    });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'LISTING_SOLD',
          title: 'Listing Marked as Sold',
          message: `Listing "${listing.title}" (ID: ${id}) was marked as sold by the owner and may be eligible for early removal.`,
          linkUrl: `/admin/listings/${id}`,
        })),
      });
    }

    return NextResponse.json({ success: true, message: 'Listing marked as sold' });
  } catch (error) {
    console.error('Error marking listing as sold:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
