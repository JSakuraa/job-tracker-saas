import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCompanies } from '@/lib/services/companies';
import { CompanyList, AddCompanyForm } from '@/components/companies';
import styles from './page.module.css';

export default async function CompaniesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const companies = await getCompanies(session.user.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>COMPANIES</h1>
        <p className={styles.subtitle}>
          Rank your preferred employers. Drag to reorder.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <CompanyList companies={companies} />
        </div>

        <aside className={styles.sidebar}>
          <AddCompanyForm />
        </aside>
      </div>
    </div>
  );
}
