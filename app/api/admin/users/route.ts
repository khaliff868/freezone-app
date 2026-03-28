// app/api/admin/users/route.ts
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
        // Get most recent session expiry as proxy for last seen
        sessions: {
          select: { expires: true },
          orderBy: { expires: 'desc' },
          take: 1,
        },
        _count: {
          select: { listings: true, feePayments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten lastSeenAt from most recent session
    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      banned: u.banned,
      createdAt: u.createdAt,
      lastSeenAt: u.sessions[0]?.expires ?? null,
      _count: u._count,
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
