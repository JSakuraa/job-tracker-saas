// T080: New application page

import { auth } from '@/lib/auth';
import { ApplicationForm } from '@/components/applications';
import styles from './page.module.css';

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ApplicationForm />
    </div>
  );
}
