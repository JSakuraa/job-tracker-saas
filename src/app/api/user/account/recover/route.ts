// T174: POST /api/user/account/recover - Recover deleted account

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user account is in deleted state and within recovery window
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    if (user.isActive) {
      return NextResponse.json(
        { error: { code: 'ALREADY_ACTIVE', message: 'Account is already active' } },
        { status: 400 }
      );
    }

    if (!user.deletedAt) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATE', message: 'Account is not in deleted state' } },
        { status: 400 }
      );
    }

    // Check if within 30-day recovery window
    const recoveryDeadline = new Date(user.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > recoveryDeadline) {
      return NextResponse.json(
        { error: { code: 'RECOVERY_EXPIRED', message: 'Recovery period has expired' } },
        { status: 410 }
      );
    }

    // Recover the account
    const [recovered] = await db
      .update(users)
      .set({
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning({ id: users.id, name: users.name });

    if (!recovered) {
      return NextResponse.json(
        { error: { code: 'RECOVERY_FAILED', message: 'Failed to recover account' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        recovered: true,
        message: 'Your account has been recovered successfully!',
      },
    });
  } catch (error) {
    console.error('Error recovering account:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to recover account' } },
      { status: 500 }
    );
  }
}
