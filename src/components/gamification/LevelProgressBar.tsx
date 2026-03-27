// T107: LevelProgressBar component

'use client';

import styles from './LevelProgressBar.module.css';

interface LevelProgressBarProps {
  progress: number; // 0-100
  isMaxLevel?: boolean;
  showLabel?: boolean;
}

export function LevelProgressBar({
  progress,
  isMaxLevel = false,
  showLabel = true,
}: LevelProgressBarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <div
          className={`${styles.fill} ${isMaxLevel ? styles.maxLevel : ''}`}
          style={{ width: `${progress}%` }}
        />
        {/* 8-bit pixel segments */}
        <div className={styles.segments}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={styles.segment} />
          ))}
        </div>
      </div>
      {showLabel && (
        <span className={styles.label}>
          {isMaxLevel ? 'MAX LEVEL!' : `${progress}%`}
        </span>
      )}
    </div>
  );
}
