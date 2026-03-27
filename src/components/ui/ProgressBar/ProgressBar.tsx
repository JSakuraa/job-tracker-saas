import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'xp' | 'quest';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && (
            <span className={styles.value}>
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`${styles.track} ${styles[variant]} ${styles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className={styles.fill} style={{ width: `${percentage}%` }}>
          {/* Pixel segments for 8-bit look */}
          <div className={styles.segments} />
        </div>
      </div>
    </div>
  );
}
