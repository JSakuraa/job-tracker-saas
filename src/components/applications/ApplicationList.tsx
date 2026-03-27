// T074: ApplicationList component

import { ApplicationCard } from './ApplicationCard';
import type { JobApplication } from '@/types/entities';
import styles from './ApplicationList.module.css';

interface ApplicationListProps {
  applications: JobApplication[];
  isLoading?: boolean;
}

export function ApplicationList({ applications, isLoading }: ApplicationListProps) {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>NO APPLICATIONS YET</p>
        <p className={styles.emptyHint}>Start tracking your job search journey!</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
}
