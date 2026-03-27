// T078: Applications list page with T081: Search and filter

import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getApplications, getApplicationStats } from '@/lib/services/applications';
import { Button } from '@/components/ui/Button';
import { ApplicationList } from '@/components/applications';
import { ApplicationFilters } from './ApplicationFilters';
import styles from './page.module.css';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const params = await searchParams;

  const filters = {
    status: params.status,
    search: params.search,
  };

  const pagination = {
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: 12,
  };

  const [{ applications, total }, stats] = await Promise.all([
    getApplications(session.user.id, filters, pagination),
    getApplicationStats(session.user.id),
  ]);

  const totalPages = Math.ceil(total / pagination.pageSize);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>APPLICATIONS</h1>
          <p className={styles.subtitle}>{total} total applications</p>
        </div>
        <Link href="/applications/new">
          <Button>+ NEW APPLICATION</Button>
        </Link>
      </div>

      <ApplicationFilters stats={stats} currentStatus={params.status} />

      <ApplicationList applications={applications} />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {pagination.page > 1 && (
            <Link
              href={{
                pathname: '/applications',
                query: { ...params, page: pagination.page - 1 },
              }}
            >
              <Button variant="secondary" size="sm">
                PREV
              </Button>
            </Link>
          )}
          <span className={styles.pageInfo}>
            Page {pagination.page} of {totalPages}
          </span>
          {pagination.page < totalPages && (
            <Link
              href={{
                pathname: '/applications',
                query: { ...params, page: pagination.page + 1 },
              }}
            >
              <Button variant="secondary" size="sm">
                NEXT
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
