// T106: XPDisplay component showing current XP/level

'use client';

import { LevelProgressBar } from './LevelProgressBar';
import { useXP } from './XPContext';
import styles from './XPDisplay.module.css';

interface XPDisplayProps {
  compact?: boolean;
}

export function XPDisplay({ compact = false }: XPDisplayProps) {
  const { xpData, isLoading } = useXP();

  if (isLoading || !xpData) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <span className={styles.levelBadge}>LV{xpData.level}</span>
        <span className={styles.xpCompact}>{xpData.total} XP</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.levelBadge}>LEVEL {xpData.level}</span>
        <span className={styles.title}>{xpData.levelTitle}</span>
      </div>
      <div className={styles.xpInfo}>
        <span className={styles.xpTotal}>{xpData.total} XP</span>
        {!xpData.isMaxLevel && (
          <span className={styles.xpNext}>
            {xpData.nextLevelXp - xpData.total} to next level
          </span>
        )}
      </div>
      <LevelProgressBar
        progress={xpData.progressPercent}
        isMaxLevel={xpData.isMaxLevel}
      />
    </div>
  );
}
