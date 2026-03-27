// T073: ApplicationCard component
// T154: Added ranked employer indicator

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import type { JobApplication } from '@/types/entities';
import styles from './ApplicationCard.module.css';

interface ApplicationCardProps {
  application: JobApplication;
  rank?: number | null | undefined;
}

export function ApplicationCard({ application, rank }: ApplicationCardProps) {
  const formattedDate = new Date(application.dateApplied).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/applications/${application.id}`} className={styles.link}>
      <Card className={styles.card}>
        <CardContent>
          <div className={styles.header}>
            <h3 className={styles.jobTitle}>{application.jobTitle}</h3>
            <StatusBadge status={application.status} />
          </div>
          <p className={styles.company}>
            {application.companyName}
            {rank && <span className={styles.rankBadge}>#{rank}</span>}
          </p>
          <div className={styles.footer}>
            <span className={styles.date}>Applied: {formattedDate}</span>
            {application.referralName && (
              <span className={styles.referral}>Referral: {application.referralName}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
