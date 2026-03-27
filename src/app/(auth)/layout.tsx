import Link from 'next/link';
import styles from './layout.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          JOB TRACKER
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>READY TO LEVEL UP?</p>
      </footer>
    </div>
  );
}
