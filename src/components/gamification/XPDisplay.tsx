// T106: XPDisplay component showing current XP/level

'use client';

import { useState, useEffect } from 'react';
import { LevelProgressBar } from './LevelProgressBar';
import styles from './XPDisplay.module.css';

interface XPData {
  total: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

interface XPDisplayProps {
  initialData?: XPData;
  compact?: boolean;
}

export function XPDisplay({ initialData, compact = false }: XPDisplayProps) {
  const [data, setData] = useState<XPData | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetchStats();
    }
  }, [initialData]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const result = await response.json();
        setData(result.data.xp);
      }
    } catch {
      console.error('Failed to fetch XP stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <span className={styles.levelBadge}>LV{data.level}</span>
        <span className={styles.xpCompact}>{data.total} XP</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.levelBadge}>LEVEL {data.level}</span>
        <span className={styles.title}>{data.levelTitle}</span>
      </div>
      <div className={styles.xpInfo}>
        <span className={styles.xpTotal}>{data.total} XP</span>
        {!data.isMaxLevel && (
          <span className={styles.xpNext}>
            {data.nextLevelXp - data.total} to next level
          </span>
        )}
      </div>
      <LevelProgressBar
        progress={data.progressPercent}
        isMaxLevel={data.isMaxLevel}
      />
    </div>
  );
}
