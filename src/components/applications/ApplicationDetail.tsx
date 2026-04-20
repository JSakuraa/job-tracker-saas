// T076: ApplicationDetail component
// T100: Integrated ResumePicker

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useXP } from '@/components/gamification';
import { StatusTimeline } from './StatusTimeline';
import { ResumePicker, ResumeCard } from '@/components/resumes';
import type { JobApplication, StatusChange, ApplicationStatus, Resume } from '@/types/entities';
import styles from './ApplicationDetail.module.css';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'applied',
  'phone_screen',
  'technical_interview',
  'onsite',
  'offer',
  'rejected',
  'withdrawn',
  'accepted',
];

interface ApplicationDetailProps {
  application: JobApplication;
  history: StatusChange[];
  attachedResumes?: Resume[];
}

export function ApplicationDetail({ application, history, attachedResumes = [] }: ApplicationDetailProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { refreshXP } = useXP();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResumePickerOpen, setIsResumePickerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>(attachedResumes);

  useEffect(() => {
    setResumes(attachedResumes);
  }, [attachedResumes]);

  const handleResumeAttach = () => {
    // Refresh the page to show the newly attached resume
    router.refresh();
    setIsResumePickerOpen(false);
  };

  const handleResumeDetach = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/applications/${application.id}/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to detach resume');
      }

      addToast({ type: 'success', message: 'Resume detached' });
      setResumes(resumes.filter((r) => r.id !== resumeId));
    } catch {
      addToast({ type: 'error', message: 'Failed to detach resume' });
    }
  };

  const formattedDate = new Date(application.dateApplied).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === application.status) {
      setIsStatusModalOpen(false);
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/applications/${application.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to update status' });
        return;
      }

      if (data.xpAwarded) {
        addToast({ type: 'xp', message: `+${data.xpAwarded} XP earned!` });
        refreshXP();
      }

      addToast({ type: 'success', message: 'Status updated!' });
      router.refresh();
    } catch {
      addToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setIsUpdating(false);
      setIsStatusModalOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to delete application' });
        return;
      }

      addToast({ type: 'success', message: 'Application deleted' });
      router.push('/applications');
      router.refresh();
    } catch {
      addToast({ type: 'error', message: 'Failed to delete application' });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.jobTitle}>{application.jobTitle}</h1>
          <p className={styles.company}>{application.companyName}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setIsStatusModalOpen(true)}>
          UPDATE STATUS
        </Button>
        <Button variant="secondary" onClick={() => router.push(`/applications/${application.id}/edit`)}>
          EDIT
        </Button>
        <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
          DELETE
        </Button>
      </div>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>DETAILS</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className={styles.details}>
              <div className={styles.detailItem}>
                <dt>Date Applied</dt>
                <dd>{formattedDate}</dd>
              </div>
              {application.referralName && (
                <div className={styles.detailItem}>
                  <dt>Referral</dt>
                  <dd>{application.referralName}</dd>
                </div>
              )}
              {application.referralContact && (
                <div className={styles.detailItem}>
                  <dt>Referral Contact</dt>
                  <dd>{application.referralContact}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>STATUS HISTORY</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline history={history} />
          </CardContent>
        </Card>
      </div>

      {application.jobDescription && (
        <Card>
          <CardHeader>
            <CardTitle>JOB DESCRIPTION</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.description}>{application.jobDescription}</p>
          </CardContent>
        </Card>
      )}

      {/* Resumes Section */}
      <Card>
        <CardHeader>
          <CardTitle>ATTACHED RESUMES</CardTitle>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <p className={styles.noResumes}>No resumes attached to this application.</p>
          ) : (
            <div className={styles.resumeList}>
              {resumes.map((resume) => (
                <div key={resume.id} className={styles.resumeItem}>
                  <ResumeCard resume={resume} showActions={false} />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleResumeDetach(resume.id)}
                  >
                    DETACH
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="secondary"
            onClick={() => setIsResumePickerOpen(true)}
            className={styles.attachButton}
          >
            + ATTACH RESUME
          </Button>
        </CardContent>
      </Card>

      {/* Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="UPDATE STATUS"
      >
        <div className={styles.statusOptions}>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              className={`${styles.statusOption} ${status === application.status ? styles.current : ''}`}
              disabled={isUpdating}
            >
              <StatusBadge status={status} />
              {status === application.status && <span className={styles.currentLabel}>CURRENT</span>}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="DELETE APPLICATION"
        size="sm"
      >
        <p className={styles.deleteWarning}>
          Are you sure you want to delete this application? This action cannot be undone.
        </p>
        <div className={styles.deleteActions}>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            CANCEL
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            DELETE
          </Button>
        </div>
      </Modal>

      {/* Resume Picker Modal */}
      <ResumePicker
        isOpen={isResumePickerOpen}
        onClose={() => setIsResumePickerOpen(false)}
        applicationId={application.id}
        attachedResumeIds={resumes.map((r) => r.id)}
        onAttach={handleResumeAttach}
      />
    </div>
  );
}
