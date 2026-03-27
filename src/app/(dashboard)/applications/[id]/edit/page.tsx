// Edit application page

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getApplicationById } from '@/lib/services/applications';
import { ApplicationForm } from '@/components/applications';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditApplicationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const { id } = await params;

  const application = await getApplicationById(id, session.user.id);

  if (!application) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <ApplicationForm
        applicationId={application.id}
        initialData={{
          jobTitle: application.jobTitle,
          companyName: application.companyName,
          dateApplied: new Date(application.dateApplied).toISOString().slice(0, 10),
          referralName: application.referralName ?? null,
          referralContact: application.referralContact ?? null,
          jobDescription: application.jobDescription ?? null,
        }}
      />
    </div>
  );
}
