// T123: QuestProgress component

'use client';

import styles from './QuestProgress.module.css';

interface QuestProgressProps {
  progress: number;
  total: number;
  percent: number;
}

export function QuestProgress({ progress, total, percent }: QuestProgressProps) {
  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <div
          className={styles.fill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={styles.label}>
        {progress} / {total}
      </span>
    </div>
  );
}
