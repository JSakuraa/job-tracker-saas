// T077: StatusTimeline component

import { StatusBadge } from '@/components/ui/Badge';
import type { StatusChange } from '@/types/entities';
import styles from './StatusTimeline.module.css';

interface StatusTimelineProps {
  history: StatusChange[];
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No status changes recorded</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {history.map((change, index) => {
        const date = new Date(change.changedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        return (
          <div key={change.id} className={styles.item}>
            <div className={styles.connector}>
              <div className={`${styles.dot} ${index === 0 ? styles.active : ''}`} />
              {index < history.length - 1 && <div className={styles.line} />}
            </div>
            <div className={styles.content}>
              <div className={styles.header}>
                <StatusBadge status={change.newStatus} />
                <span className={styles.timestamp}>
                  {formattedDate} at {formattedTime}
                </span>
              </div>
              {change.previousStatus && (
                <p className={styles.transition}>
                  Changed from{' '}
                  <span className={styles.previousStatus}>
                    {formatStatus(change.previousStatus)}
                  </span>
                </p>
              )}
              {!change.previousStatus && (
                <p className={styles.transition}>Application created</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
