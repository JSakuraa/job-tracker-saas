// T110: Added XPDisplay to sidebar

'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XPDisplay } from '@/components/gamification';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'DASHBOARD', href: '/dashboard', icon: '>' },
  { label: 'APPLICATIONS', href: '/applications', icon: '>' },
  { label: 'RESUMES', href: '/resumes', icon: '>' },
  { label: 'QUESTS', href: '/quests', icon: '>' },
  { label: 'GOALS', href: '/goals', icon: '>' },
  { label: 'RANKINGS', href: '/rankings', icon: '>' },
  { label: 'REWARDS', href: '/rewards', icon: '>' },
  { label: 'PROFILE', href: '/profile', icon: '>' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.xpSection}>
        <XPDisplay />
      </div>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href as Route}
                  className={`${styles.link} ${isActive ? styles.active : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
