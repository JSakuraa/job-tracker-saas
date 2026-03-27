// T109: XPNotification toast component

'use client';

import { useEffect, useState } from 'react';
import styles from './XPNotification.module.css';

interface XPNotificationProps {
  amount: number;
  onComplete?: () => void;
}

export function XPNotification({ amount, onComplete }: XPNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.notification} ${isAnimating ? styles.animate : styles.fadeOut}`}>
      <span className={styles.plus}>+</span>
      <span className={styles.amount}>{amount}</span>
      <span className={styles.label}>XP</span>
    </div>
  );
}
