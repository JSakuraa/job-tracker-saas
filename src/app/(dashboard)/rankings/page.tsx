// T153: Rankings page

import { auth } from '@/lib/auth';
import { getRankings } from '@/lib/services/rankings';
import { RankedEmployerList, AddEmployerForm } from '@/components/rankings';
import styles from './page.module.css';

export default async function RankingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const rankings = await getRankings(session.user.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>EMPLOYER RANKINGS</h1>
        <p className={styles.subtitle}>
          Rank your preferred employers. Drag to reorder.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <RankedEmployerList employers={rankings} />
        </div>

        <aside className={styles.sidebar}>
          <AddEmployerForm />
        </aside>
      </div>
    </div>
  );
}
