import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bannerId } = body;

    if (!bannerId) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });
    }

    await prisma.bannerAd.update({
      where: { id: bannerId },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json({ success: false });
  }
}
