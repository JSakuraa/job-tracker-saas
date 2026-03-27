// T140: GoalList component

'use client';

import { GoalCard } from './GoalCard';
import type { PersonalGoal } from '@/types/entities';
import styles from './GoalList.module.css';

interface GoalListProps {
  goals: PersonalGoal[];
  onUpdate?: () => void;
  emptyMessage?: string;
}

export function GoalList({
  goals,
  onUpdate,
  emptyMessage = 'No goals yet. Create one to get started!',
}: GoalListProps) {
  if (goals.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
