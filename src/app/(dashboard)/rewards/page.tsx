// T167: Rewards page

import { auth } from '@/lib/auth';
import { getRewards } from '@/lib/services/rewards';
import { AvatarSelector, ThemeSelector, RewardGrid } from '@/components/rewards';
import styles from './page.module.css';

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const rewards = await getRewards(session.user.id);

  const badges = rewards.filter((r) => r.type === 'badge');
  const avatars = rewards.filter((r) => r.type === 'avatar');
  const themes = rewards.filter((r) => r.type === 'theme');

  const unlockedCount = rewards.filter((r) => r.isUnlocked).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>REWARDS</h1>
        <p className={styles.subtitle}>
          Unlock rewards by leveling up. {unlockedCount} of {rewards.length} unlocked.
        </p>
      </div>

      <div className={styles.sections}>
        {badges.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>BADGES</h2>
            <p className={styles.sectionSubtitle}>Show off your achievements</p>
            <RewardGrid rewards={badges} />
          </section>
        )}

        {avatars.length > 0 && (
          <section className={styles.section}>
            <AvatarSelector rewards={avatars} />
          </section>
        )}

        {themes.length > 0 && (
          <section className={styles.section}>
            <ThemeSelector rewards={themes} />
          </section>
        )}

        {rewards.length === 0 && (
          <div className={styles.empty}>
            <p>No rewards available yet. Keep leveling up to unlock rewards!</p>
          </div>
        )}
      </div>
    </div>
  );
}
