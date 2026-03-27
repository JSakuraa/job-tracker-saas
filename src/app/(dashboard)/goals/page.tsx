// T141: Goals page

import { auth } from '@/lib/auth';
import { getGoals } from '@/lib/services/goals';
import { GoalList, GoalForm } from '@/components/gamification';
import styles from './page.module.css';

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const goals = await getGoals(session.user.id);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const achievedGoals = goals.filter((g) => g.status === 'achieved');
  const abandonedGoals = goals.filter((g) => g.status === 'abandoned');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>PERSONAL GOALS</h1>
        <p className={styles.subtitle}>
          Set and track your own job search goals
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>ACTIVE GOALS</h2>
            <GoalList
              goals={activeGoals}
              emptyMessage="No active goals. Create one to start tracking!"
            />
          </section>

          {achievedGoals.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>ACHIEVED</h2>
              <GoalList goals={achievedGoals} />
            </section>
          )}

          {abandonedGoals.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>ABANDONED</h2>
              <GoalList goals={abandonedGoals} />
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <GoalForm />
        </aside>
      </div>
    </div>
  );
}
