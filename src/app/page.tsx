import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>JOB TRACKER</h1>
          <p className={styles.subtitle}>LEVEL UP YOUR JOB SEARCH</p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📋</span>
              <span>TRACK APPLICATIONS</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⭐</span>
              <span>EARN XP</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🏆</span>
              <span>COMPLETE QUESTS</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎮</span>
              <span>UNLOCK REWARDS</span>
            </div>
          </div>

          <div className={styles.cta}>
            <Link href="/register" className={styles.primaryButton}>
              START YOUR QUEST
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              CONTINUE JOURNEY
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>+25 XP</span>
              <span className={styles.statLabel}>per application</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>+10 XP</span>
              <span className={styles.statLabel}>per status update</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>+15 XP</span>
              <span className={styles.statLabel}>per resume upload</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
