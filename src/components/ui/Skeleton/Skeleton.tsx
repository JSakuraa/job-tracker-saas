// T177: Loading skeletons for list views

import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="rectangular" width={80} height={24} />
      </div>
      <Skeleton variant="text" width="40%" height={16} />
      <div className={styles.cardFooter}>
        <Skeleton variant="text" width={100} height={12} />
        <Skeleton variant="text" width={80} height={12} />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className={styles.tableRow}>
      <Skeleton variant="text" width="30%" height={16} />
      <Skeleton variant="text" width="20%" height={16} />
      <Skeleton variant="rectangular" width={80} height={24} />
      <Skeleton variant="text" width="15%" height={16} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <Skeleton variant="text" width="30%" height={14} />
        <Skeleton variant="text" width="20%" height={14} />
        <Skeleton variant="text" width="15%" height={14} />
        <Skeleton variant="text" width="15%" height={14} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
