// T103: GET /api/user/stats - Get user stats including XP and level

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users, jobApplications, resumes } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getLevelProgress, getLevelTitle } from '@/lib/xp/utils';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user data
    const [user] = await db
      .select({
        totalXp: users.totalXp,
        loginStreakCount: users.loginStreakCount,
        lastLoginDate: users.lastLoginDate,
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

    // Get counts
    const [applicationStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${jobApplications.status} not in ('rejected', 'withdrawn', 'accepted'))`,
      })
      .from(jobApplications)
      .where(eq(jobApplications.userId, session.user.id));

    const [resumeStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(resumes)
      .where(eq(resumes.userId, session.user.id));

    // Calculate level info
    const levelProgress = getLevelProgress(user.totalXp);
    const levelTitle = getLevelTitle(levelProgress.level);

    return NextResponse.json({
      data: {
        xp: {
          total: user.totalXp,
          level: levelProgress.level,
          levelTitle,
          currentLevelXp: levelProgress.currentLevelXp,
          nextLevelXp: levelProgress.nextLevelXp,
          progressXp: levelProgress.progressXp,
          progressPercent: levelProgress.progressPercent,
          isMaxLevel: levelProgress.isMaxLevel,
        },
        streak: {
          count: user.loginStreakCount,
          lastLoginDate: user.lastLoginDate,
        },
        stats: {
          totalApplications: Number(applicationStats?.total ?? 0),
          activeApplications: Number(applicationStats?.active ?? 0),
          totalResumes: Number(resumeStats?.total ?? 0),
        },
        memberSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user stats' } },
      { status: 500 }
    );
  }
}
