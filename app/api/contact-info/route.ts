import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  phone: '290-1117',
  whatsapp: '752-2936',
  email1: 'khaliff@email.com',
  email2: 'freezone@marketplace.com',
  tiktok: 'freezone@tt',
  facebook: 'Freezonett',
  instagram: 'Freezonett',
};

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'site_settings' },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'site_settings', ...DEFAULTS },
      });
    }

    return NextResponse.json({ info: settings });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json({ info: DEFAULTS });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, whatsapp, email1, email2, tiktok, facebook, instagram } = body;

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'site_settings' },
      update: { phone, whatsapp, email1, email2, tiktok, facebook, instagram },
      create: { id: 'site_settings', phone, whatsapp, email1, email2, tiktok, facebook, instagram },
    });

    return NextResponse.json({ message: 'Contact info updated', info: updated });
  } catch (error) {
    console.error('Error updating contact info:', error);
    return NextResponse.json({ error: 'Failed to update contact info' }, { status: 500 });
  }
}
