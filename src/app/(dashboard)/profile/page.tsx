// T111: Profile page with XP history
// T168: Integrated equipped avatar display
// T175: Added profile editing
// T176: Added account deletion

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users, xpEvents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getLevelProgress, getLevelTitle } from '@/lib/xp/utils';
import { XP_ACTION_TYPES } from '@/lib/xp/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LevelProgressBar } from '@/components/gamification';
import { ProfileEditor, AccountDeletion } from '@/components/profile';
import type { UserCustomization } from '@/lib/db/schema';
import styles from './page.module.css';

const ACTION_LABELS: Record<string, string> = {
  [XP_ACTION_TYPES.APPLICATION_CREATED]: 'Created Application',
  [XP_ACTION_TYPES.STATUS_UPDATED]: 'Updated Status',
  [XP_ACTION_TYPES.RESUME_UPLOADED]: 'Uploaded Resume',
  [XP_ACTION_TYPES.QUEST_COMPLETED]: 'Completed Quest',
  [XP_ACTION_TYPES.GOAL_ACHIEVED]: 'Achieved Goal',
  [XP_ACTION_TYPES.LOGIN_STREAK]: 'Login Streak',
  [XP_ACTION_TYPES.PROFILE_UPDATED]: 'Updated Profile',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  // Get user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user) {
    return null;
  }

  // Get XP history
  const xpHistory = await db
    .select()
    .from(xpEvents)
    .where(eq(xpEvents.userId, session.user.id))
    .orderBy(desc(xpEvents.createdAt))
    .limit(20);

  const levelProgress = getLevelProgress(user.totalXp);
  const levelTitle = getLevelTitle(levelProgress.level);
  const customization = (user.customization ?? {}) as UserCustomization;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Avatar display logic
  const avatarIcon = getAvatarIcon(customization.avatarId);

function getAvatarIcon(avatarId: string | undefined): string {
  const avatarIcons: Record<string, string> = {
    'avatar-default': '👤',
    'avatar-shades': '😎',
    'avatar-business': '👔',
    'avatar-wizard': '🧙',
    'avatar-golden': '🏆',
  };
  return avatarIcons[avatarId ?? 'avatar-default'] ?? '👤';
}

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatar}>{avatarIcon}</div>
        <div>
          <h1>PROFILE</h1>
          <p className={styles.subtitle}>Member since {memberSince}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>ACCOUNT</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className={styles.details}>
              <div className={styles.detailItem}>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Login Streak</dt>
                <dd>{user.loginStreakCount} days</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LEVEL PROGRESS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.levelInfo}>
              <div className={styles.levelHeader}>
                <span className={styles.levelBadge}>LEVEL {levelProgress.level}</span>
                <span className={styles.levelTitle}>{levelTitle}</span>
              </div>
              <div className={styles.xpTotal}>{user.totalXp} XP</div>
              <LevelProgressBar
                progress={levelProgress.progressPercent}
                isMaxLevel={levelProgress.isMaxLevel}
              />
              {!levelProgress.isMaxLevel && (
                <p className={styles.xpNext}>
                  {levelProgress.nextLevelXp - user.totalXp} XP to Level {levelProgress.level + 1}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>XP HISTORY</CardTitle>
        </CardHeader>
        <CardContent>
          {xpHistory.length === 0 ? (
            <p className={styles.emptyHistory}>No XP earned yet. Start tracking applications!</p>
          ) : (
            <div className={styles.history}>
              {xpHistory.map((event) => (
                <div key={event.id} className={styles.historyItem}>
                  <div className={styles.historyContent}>
                    <span className={styles.historyAction}>
                      {ACTION_LABELS[event.actionType] ?? event.actionType}
                    </span>
                    <span className={styles.historyDate}>
                      {new Date(event.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className={styles.historyXp}>+{event.xpAmount} XP</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className={styles.settings}>
        <ProfileEditor currentName={user.name} />
        <AccountDeletion />
      </div>
    </div>
  );
}
