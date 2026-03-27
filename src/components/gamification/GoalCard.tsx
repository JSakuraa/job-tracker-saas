// T138: GoalCard component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { PersonalGoal } from '@/types/entities';
import styles from './GoalCard.module.css';

interface GoalCardProps {
  goal: PersonalGoal;
  onUpdate?: (() => void) | undefined;
}

const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  active: 'info',
  achieved: 'success',
  abandoned: 'default',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  application_created: 'Applications',
  status_updated: 'Status Updates',
  resume_uploaded: 'Resumes',
};

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isAchieving, setIsAchieving] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  const progressPercent = Math.min(100, Math.floor((goal.currentCount / goal.targetCount) * 100));
  const isActive = goal.status === 'active';
  const isAchieved = goal.status === 'achieved';

  const handleAchieve = async () => {
    setIsAchieving(true);

    try {
      const response = await fetch(`/api/goals/${goal.id}/achieve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to mark goal as achieved' });
        return;
      }

      if (data.data.xpAwarded) {
        addToast({ type: 'xp', message: `+${data.data.xpAwarded} XP earned!` });
      }

      addToast({ type: 'success', message: 'Goal achieved!' });

      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to mark goal as achieved' });
    } finally {
      setIsAchieving(false);
    }
  };

  const handleAbandon = async () => {
    setIsAbandoning(true);

    try {
      const response = await fetch(`/api/goals/${goal.id}/abandon`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to abandon goal' });
        return;
      }

      addToast({ type: 'success', message: 'Goal abandoned' });

      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to abandon goal' });
    } finally {
      setIsAbandoning(false);
    }
  };

  const deadlineText = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Card className={`${styles.card} ${!isActive ? styles.inactive : ''}`}>
      <CardContent className={styles.content}>
        <div className={styles.header}>
          <Badge variant={STATUS_VARIANTS[goal.status] ?? 'default'} size="sm">
            {goal.status.toUpperCase()}
          </Badge>
          {deadlineText && (
            <span className={styles.deadline}>Due: {deadlineText}</span>
          )}
        </div>

        <h3 className={styles.title}>{goal.title}</h3>
        {goal.description && (
          <p className={styles.description}>{goal.description}</p>
        )}

        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {goal.currentCount} / {goal.targetCount} {TARGET_TYPE_LABELS[goal.targetType] ?? goal.targetType}
          </span>
        </div>

        {isActive && (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAchieve}
              isLoading={isAchieving}
            >
              MARK ACHIEVED
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleAbandon}
              isLoading={isAbandoning}
            >
              ABANDON
            </Button>
          </div>
        )}

        {isAchieved && goal.achievedAt && (
          <p className={styles.achievedDate}>
            Achieved on {new Date(goal.achievedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
