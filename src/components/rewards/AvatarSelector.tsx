// T165: AvatarSelector component

'use client';

import { RewardGrid } from './RewardGrid';
import type { Reward } from '@/types/entities';
import styles from './AvatarSelector.module.css';

interface RewardWithStatus extends Reward {
  isUnlocked: boolean;
  isEquipped: boolean;
  unlockedAt: Date | null;
}

interface AvatarSelectorProps {
  rewards: RewardWithStatus[];
  onUpdate?: (() => void) | undefined;
}

export function AvatarSelector({ rewards, onUpdate }: AvatarSelectorProps) {
  const avatars = rewards.filter((r) => r.type === 'avatar');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>AVATARS</h2>
      <p className={styles.subtitle}>Choose your profile avatar</p>
      <RewardGrid
        rewards={avatars}
        onUpdate={onUpdate}
        emptyMessage="No avatars available yet. Keep leveling up!"
      />
    </div>
  );
}
