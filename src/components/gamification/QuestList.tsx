// T122: QuestList component

'use client';

import { QuestCard } from './QuestCard';
import type { Quest, UserQuest } from '@/types/entities';
import styles from './QuestList.module.css';

interface QuestWithProgress {
  quest: Quest;
  userQuest: UserQuest | null;
  progressPercent: number;
}

interface QuestListProps {
  quests: QuestWithProgress[];
  onClaim?: () => void;
  emptyMessage?: string;
}

export function QuestList({
  quests,
  onClaim,
  emptyMessage = 'No quests available.',
}: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {quests.map((item) => (
        <QuestCard
          key={item.quest.id}
          quest={item.quest}
          userQuest={item.userQuest}
          progressPercent={item.progressPercent}
          onClaim={onClaim}
        />
      ))}
    </div>
  );
}
