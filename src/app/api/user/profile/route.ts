// T171: GET /api/user/profile - Get user profile
// T172: PATCH /api/user/profile - Update user profile

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { awardXp } from '@/lib/xp/service';
import { XP_ACTION_TYPES } from '@/lib/xp/constants';
import { getLevelProgress, getLevelTitle } from '@/lib/xp/utils';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  customization: z
    .object({
      avatarId: z.string().optional(),
      themeId: z.string().optional(),
      badgeIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        totalXp: users.totalXp,
        loginStreakCount: users.loginStreakCount,
        lastLoginDate: users.lastLoginDate,
        customization: users.customization,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const levelProgress = getLevelProgress(user.totalXp);
    const levelTitle = getLevelTitle(levelProgress.level);

    return NextResponse.json({
      data: {
        ...user,
        level: levelProgress.level,
        levelTitle,
        levelProgress: levelProgress.progressPercent,
        xpToNextLevel: levelProgress.isMaxLevel
          ? 0
          : levelProgress.nextLevelXp - user.totalXp,
        isMaxLevel: levelProgress.isMaxLevel,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    if (parsed.data.customization !== undefined) {
      // Filter out undefined values for exactOptionalPropertyTypes compliance
      const customization: { avatarId?: string; themeId?: string; badgeIds?: string[] } = {};
      if (parsed.data.customization.avatarId !== undefined) {
        customization.avatarId = parsed.data.customization.avatarId;
      }
      if (parsed.data.customization.themeId !== undefined) {
        customization.themeId = parsed.data.customization.themeId;
      }
      if (parsed.data.customization.badgeIds !== undefined) {
        customization.badgeIds = parsed.data.customization.badgeIds;
      }
      updateData.customization = customization;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        totalXp: users.totalXp,
        customization: users.customization,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Award XP for updating profile (once per day limit would be ideal but not implemented here)
    await awardXp(session.user.id, XP_ACTION_TYPES.PROFILE_UPDATED);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
