import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import styles from './layout.module.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <Header user={{ name: session.user.name ?? '', email: session.user.email ?? '' }} />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
