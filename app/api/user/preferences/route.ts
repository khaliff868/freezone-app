import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Load user preferences and profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        phone: true,
        whatsapp: true,
        avatar: true,
        location: true,
        bio: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        avatar: user.avatar,
        location: user.location,
        bio: user.bio,
      },
      preferences: user.preferences || {},
    });
  } catch (error) {
    console.error('Error loading preferences:', error);
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }
}

// PUT - Save user preferences and profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, preferences } = body;

    // Update profile fields on User model
    if (profile) {
      const profileUpdate: Record<string, unknown> = {};
      const allowedProfileFields = ['name', 'displayName', 'phone', 'whatsapp', 'location', 'bio'];
      for (const field of allowedProfileFields) {
        if (field in profile) {
          profileUpdate[field] = profile[field];
        }
      }
      if (Object.keys(profileUpdate).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: profileUpdate,
        });
      }
    }

    // Update preferences
    if (preferences) {
      // Filter out non-preference fields
      const { id, userId, createdAt, updatedAt, user, ...prefData } = preferences;

      await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...prefData,
        },
        update: prefData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
