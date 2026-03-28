import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admin accounts cannot be deleted' }, { status: 400 });
    }

    // Delete in FK-safe order
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.message.deleteMany({ where: { senderId: userId } });
    await prisma.conversation.deleteMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
    });

    const swapOffers = await prisma.swapOffer.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      select: { id: true },
    });
    if (swapOffers.length > 0) {
      await prisma.swapDeal.deleteMany({
        where: { swapOfferId: { in: swapOffers.map(s => s.id) } },
      });
    }

    await prisma.swapOffer.deleteMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    });
    await prisma.wishlist.deleteMany({ where: { userId } });
    await prisma.feePayment.deleteMany({ where: { userId } });
    await prisma.bannerAd.deleteMany({ where: { userId } });
    await prisma.userPreferences.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.listing.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      message: `User "${user.name}" and all their content have been permanently deleted.`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
