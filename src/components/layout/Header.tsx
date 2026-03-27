'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/lib/theme/provider';
import { Button } from '@/components/ui/Button';
import styles from './Header.module.css';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/applications" className={styles.logo}>
          JOB TRACKER
        </Link>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          {resolvedTheme === 'light' ? '🌙' : '☀️'}
        </button>

        {user && (
          <div className={styles.userMenu}>
            <Link href="/profile" className={styles.userInfo}>
              <span className={styles.avatar}>👤</span>
              <span className={styles.userName}>{user.name}</span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              LOGOUT
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
