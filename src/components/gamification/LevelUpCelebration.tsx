// T108: LevelUpCelebration modal with 8-bit animation

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getLevelTitle } from '@/lib/xp/utils';
import styles from './LevelUpCelebration.module.css';

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
}

export function LevelUpCelebration({ isOpen, onClose, newLevel }: LevelUpCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const levelTitle = getLevelTitle(newLevel);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className={styles.container}>
        {showConfetti && (
          <div className={styles.confetti}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={styles.confettiPiece}
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}

        <div className={styles.starContainer}>
          <div className={styles.star}>★</div>
        </div>

        <h2 className={styles.title}>LEVEL UP!</h2>

        <div className={styles.levelBadge}>
          <span className={styles.levelNumber}>LEVEL {newLevel}</span>
        </div>

        <p className={styles.subtitle}>You are now a</p>
        <p className={styles.levelTitle}>{levelTitle}</p>

        <p className={styles.message}>Keep up the great work!</p>

        <Button onClick={onClose} className={styles.button}>
          AWESOME!
        </Button>
      </div>
    </Modal>
  );
}
