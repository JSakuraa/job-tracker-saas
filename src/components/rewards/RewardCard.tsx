// T163: RewardCard component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { Reward } from '@/types/entities';
import styles from './RewardCard.module.css';

interface RewardCardProps {
  reward: Reward & {
    isUnlocked: boolean;
    isEquipped: boolean;
    unlockedAt: Date | null;
  };
  onUpdate?: (() => void) | undefined;
}

const REWARD_TYPE_ICONS: Record<string, string> = {
  badge: '🏆',
  avatar: '👤',
  theme: '🎨',
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  badge: 'BADGE',
  avatar: 'AVATAR',
  theme: 'THEME',
};

export function RewardCard({ reward, onUpdate }: RewardCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isEquipping, setIsEquipping] = useState(false);
  const [isUnequipping, setIsUnequipping] = useState(false);

  const handleEquip = async () => {
    setIsEquipping(true);

    try {
      const response = await fetch(`/api/rewards/${reward.id}/equip`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to equip' });
        return;
      }

      addToast({ type: 'success', message: `${reward.name} equipped!` });

      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to equip reward' });
    } finally {
      setIsEquipping(false);
    }
  };

  const handleUnequip = async () => {
    setIsUnequipping(true);

    try {
      const response = await fetch(`/api/rewards/${reward.id}/unequip`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to unequip' });
        return;
      }

      addToast({ type: 'success', message: `${reward.name} unequipped` });

      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to unequip reward' });
    } finally {
      setIsUnequipping(false);
    }
  };

  const unlockCriteria = reward.unlockCriteria as { type: string; value: number | string };
  const unlockText =
    unlockCriteria.type === 'level'
      ? `Reach Level ${unlockCriteria.value}`
      : `Complete ${unlockCriteria.value}`;

  return (
    <Card className={`${styles.card} ${!reward.isUnlocked ? styles.locked : ''}`}>
      <CardContent className={styles.content}>
        <div className={styles.icon}>{REWARD_TYPE_ICONS[reward.type] ?? '🎁'}</div>

        <div className={styles.info}>
          <div className={styles.header}>
            <Badge variant={reward.isUnlocked ? 'success' : 'default'} size="sm">
              {REWARD_TYPE_LABELS[reward.type] ?? reward.type}
            </Badge>
            {reward.isEquipped && (
              <Badge variant="info" size="sm">
                EQUIPPED
              </Badge>
            )}
          </div>

          <h3 className={styles.name}>{reward.name}</h3>
          <p className={styles.description}>{reward.description}</p>

          {!reward.isUnlocked && (
            <p className={styles.unlockHint}>🔒 {unlockText}</p>
          )}
        </div>

        {reward.isUnlocked && (
          <div className={styles.actions}>
            {reward.isEquipped ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUnequip}
                isLoading={isUnequipping}
              >
                UNEQUIP
              </Button>
            ) : (
              <Button size="sm" onClick={handleEquip} isLoading={isEquipping}>
                EQUIP
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
