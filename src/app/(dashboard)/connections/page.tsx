import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getConnections } from '@/lib/services/connections';
import { ConnectionList, AddConnectionForm } from '@/components/connections';
import styles from './page.module.css';

export default async function ConnectionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const connections = await getConnections(session.user.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>CONNECTIONS</h1>
        <p className={styles.subtitle}>
          Track your professional contacts and outreach efforts.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <ConnectionList connections={connections} />
        </div>

        <aside className={styles.sidebar}>
          <AddConnectionForm />
        </aside>
      </div>
    </div>
  );
}
