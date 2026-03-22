import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    if (action !== 'ban' && action !== 'unban') {
      return NextResponse.json({ error: 'action must be ban or unban' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot ban your own account' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, banned: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot ban admin accounts' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { banned: action === 'ban' },
      select: { id: true, banned: true },
    });

    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      banned: updatedUser.banned,
    });
  } catch (error) {
    console.error('Error toggling ban status:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
