// T079: Application detail page
// T100: Integrated attached resumes

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getApplicationById } from '@/lib/services/applications';
import { getStatusHistory } from '@/lib/services/statusChanges';
import { getResumesForApplication } from '@/lib/services/resumes';
import { ApplicationDetail } from '@/components/applications';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const { id } = await params;

  const [application, history, attachedResumes] = await Promise.all([
    getApplicationById(id, session.user.id),
    getStatusHistory(id, session.user.id),
    getResumesForApplication(id, session.user.id),
  ]);

  if (!application) {
    notFound();
  }

  return (
    <ApplicationDetail
      application={application}
      history={history}
      attachedResumes={attachedResumes}
    />
  );
}
