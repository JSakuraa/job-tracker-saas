import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'xp' | 'level';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}

// Status-specific badges
export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const variant = getStatusVariant(status);
  const label = formatStatus(status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'applied':
      return 'info';
    case 'phone_screen':
    case 'technical_interview':
    case 'onsite':
      return 'warning';
    case 'offer':
    case 'accepted':
      return 'success';
    case 'rejected':
    case 'withdrawn':
      return 'error';
    default:
      return 'default';
  }
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
