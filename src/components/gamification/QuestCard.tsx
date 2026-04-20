// T121: QuestCard component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { QuestProgress } from './QuestProgress';
import { useXP } from './XPContext';
import type { Quest, UserQuest } from '@/types/entities';
import styles from './QuestCard.module.css';

interface QuestCardProps {
  quest: Quest;
  userQuest: UserQuest | null;
  progressPercent: number;
  onClaim?: (() => void) | undefined;
}

const QUEST_TYPE_LABELS: Record<string, string> = {
  one_time: 'ONE-TIME',
  daily: 'DAILY',
  weekly: 'WEEKLY',
  achievement: 'ACHIEVEMENT',
};

export function QuestCard({ quest, userQuest, progressPercent, onClaim }: QuestCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { refreshXP } = useXP();
  const [isClaiming, setIsClaiming] = useState(false);

  const status = userQuest?.status ?? 'not_started';
  const isCompleted = status === 'completed';
  const isClaimed = status === 'claimed';
  const canClaim = isCompleted && !isClaimed;

  const handleClaim = async () => {
    setIsClaiming(true);

    try {
      const response = await fetch(`/api/quests/${quest.id}/claim`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to claim reward' });
        return;
      }

      if (data.data.xpAwarded) {
        addToast({ type: 'xp', message: `+${data.data.xpAwarded} XP earned!` });
        refreshXP();
      }

      addToast({ type: 'success', message: 'Quest reward claimed!' });

      if (onClaim) {
        onClaim();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to claim reward' });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className={`${styles.card} ${isClaimed ? styles.claimed : ''}`}>
      <CardContent className={styles.content}>
        <div className={styles.header}>
          <Badge variant="default" size="sm">
            {QUEST_TYPE_LABELS[quest.type] ?? quest.type}
          </Badge>
          <span className={styles.reward}>+{quest.xpReward} XP</span>
        </div>

        <h3 className={styles.name}>{quest.name}</h3>
        <p className={styles.description}>{quest.description}</p>

        <QuestProgress
          progress={userQuest?.progress ?? 0}
          total={(quest.requirements as { count: number }).count}
          percent={progressPercent}
        />

        <div className={styles.footer}>
          {canClaim ? (
            <Button onClick={handleClaim} isLoading={isClaiming} size="sm">
              CLAIM REWARD
            </Button>
          ) : isClaimed ? (
            <span className={styles.claimedLabel}>CLAIMED</span>
          ) : (
            <span className={styles.progressLabel}>
              {progressPercent}% COMPLETE
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
