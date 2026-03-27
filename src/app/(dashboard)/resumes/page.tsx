// T099: Resumes library page

import { auth } from '@/lib/auth';
import { getResumes } from '@/lib/services/resumes';
import { ResumeUploader, ResumeList } from '@/components/resumes';
import styles from './page.module.css';

export default async function ResumesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const resumes = await getResumes(session.user.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>RESUMES</h1>
          <p className={styles.subtitle}>{resumes.length} resume{resumes.length !== 1 ? 's' : ''} uploaded</p>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>UPLOAD NEW</h2>
        <ResumeUploader />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>YOUR RESUMES</h2>
        <ResumeList resumes={resumes} />
      </section>
    </div>
  );
}
