import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'contact-info.json');

const DEFAULT_CONTACT = {
  phone: '290-1117',
  whatsapp: '752-2936',
  email1: 'khaliff@email.com',
  email2: 'freezone@marketplace.com',
  tiktok: 'freezone@tt',
  facebook: 'Freezonett',
  instagram: 'Freezonett',
};

async function readContactInfo() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONTACT;
  }
}

async function writeContactInfo(data: typeof DEFAULT_CONTACT) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const info = await readContactInfo();
    return NextResponse.json({ info });
  } catch {
    return NextResponse.json({ info: DEFAULT_CONTACT });
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

    const updated = { phone, whatsapp, email1, email2, tiktok, facebook, instagram };
    await writeContactInfo(updated);

    return NextResponse.json({ message: 'Contact info updated', info: updated });
  } catch (error) {
    console.error('Error updating contact info:', error);
    return NextResponse.json({ error: 'Failed to update contact info' }, { status: 500 });
  }
}
