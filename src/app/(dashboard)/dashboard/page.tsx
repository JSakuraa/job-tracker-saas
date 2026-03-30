import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApplicationStats } from '@/lib/services/applications';
import { getActiveQuests } from '@/lib/services/quests';
import { getLevelProgress, getLevelTitle } from '@/lib/xp/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LevelProgressBar } from '@/components/gamification';
import { Button } from '@/components/ui/Button';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const [userRow] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRow) {
    redirect('/login');
  }

  const [stats, activeQuests] = await Promise.all([
    getApplicationStats(session.user.id),
    getActiveQuests(session.user.id),
  ]);

  const levelProgress = getLevelProgress(userRow.totalXp);
  const levelTitle = getLevelTitle(levelProgress.level);

  const totalApps = Object.values(stats).reduce((a, b) => a + b, 0);
  const inProgress = (stats['phone_screen'] ?? 0) + (stats['technical_interview'] ?? 0) + (stats['onsite'] ?? 0);
  const offers = stats['offer'] ?? 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>DASHBOARD</h1>
          <p className={styles.subtitle}>Welcome back, {userRow.name}!</p>
        </div>
        <Link href="/applications/new">
          <Button>+ NEW APPLICATION</Button>
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardContent>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalApps}</span>
              <span className={styles.statLabel}>TOTAL APPLICATIONS</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={styles.stat}>
              <span className={styles.statValue}>{inProgress}</span>
              <span className={styles.statLabel}>IN PROGRESS</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={styles.stat}>
              <span className={styles.statValue}>{offers}</span>
              <span className={styles.statLabel}>OFFERS</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={styles.stat}>
              <span className={styles.statValue}>{userRow.totalXp}</span>
              <span className={styles.statLabel}>TOTAL XP</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.grid}>
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
              <LevelProgressBar
                progress={levelProgress.progressPercent}
                isMaxLevel={levelProgress.isMaxLevel}
              />
              {!levelProgress.isMaxLevel && (
                <p className={styles.xpNext}>
                  {levelProgress.nextLevelXp - userRow.totalXp} XP to Level {levelProgress.level + 1}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className={styles.cardHeaderRow}>
              <CardTitle>ACTIVE QUESTS</CardTitle>
              <Link href="/quests" className={styles.viewAll}>VIEW ALL</Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeQuests.length === 0 ? (
              <p className={styles.empty}>No active quests available.</p>
            ) : (
              <div className={styles.questList}>
                {activeQuests.slice(0, 3).map((q) => (
                  <div key={q.id} className={styles.questItem}>
                    <div className={styles.questName}>{q.name}</div>
                    <div className={styles.questXp}>+{q.xpReward} XP</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={styles.quickLinks}>
        <Link href="/applications"><Button variant="secondary">APPLICATIONS</Button></Link>
        <Link href="/rankings"><Button variant="secondary">RANKINGS</Button></Link>
        <Link href="/resumes"><Button variant="secondary">RESUMES</Button></Link>
        <Link href="/goals"><Button variant="secondary">GOALS</Button></Link>
        <Link href="/rewards"><Button variant="secondary">REWARDS</Button></Link>
      </div>
    </div>
  );
}
