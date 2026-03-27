// T173: DELETE /api/user/account - Delete account with 30-day grace period

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Soft delete: Set deletedAt timestamp
    // User has 30 days to recover the account
    const deletedAt = new Date();
    const recoveryDeadline = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [updated] = await db
      .update(users)
      .set({
        isActive: false,
        deletedAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning({ id: users.id, deletedAt: users.deletedAt });

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        deleted: true,
        deletedAt: updated.deletedAt,
        recoveryDeadline: recoveryDeadline.toISOString(),
        message: 'Account scheduled for deletion. You have 30 days to recover your account.',
      },
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete account' } },
      { status: 500 }
    );
  }
}
