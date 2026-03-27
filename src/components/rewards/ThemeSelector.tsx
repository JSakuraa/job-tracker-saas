// T166: ThemeSelector component

'use client';

import { RewardGrid } from './RewardGrid';
import type { Reward } from '@/types/entities';
import styles from './ThemeSelector.module.css';

interface RewardWithStatus extends Reward {
  isUnlocked: boolean;
  isEquipped: boolean;
  unlockedAt: Date | null;
}

interface ThemeSelectorProps {
  rewards: RewardWithStatus[];
  onUpdate?: (() => void) | undefined;
}

export function ThemeSelector({ rewards, onUpdate }: ThemeSelectorProps) {
  const themes = rewards.filter((r) => r.type === 'theme');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>THEMES</h2>
      <p className={styles.subtitle}>Customize your interface colors</p>
      <RewardGrid
        rewards={themes}
        onUpdate={onUpdate}
        emptyMessage="No themes available yet. Keep leveling up!"
      />
    </div>
  );
}
