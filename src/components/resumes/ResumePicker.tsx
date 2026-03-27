// T098: ResumePicker modal for attaching resumes to applications

'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Resume } from '@/types/entities';
import styles from './ResumePicker.module.css';

interface ResumePickerProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  attachedResumeIds: string[];
  onAttach: (resumeId: string) => void;
}

export function ResumePicker({
  isOpen,
  onClose,
  applicationId,
  attachedResumeIds,
  onAttach,
}: ResumePickerProps) {
  const { addToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/resumes');
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      const { data } = await response.json();
      setResumes(data);
    } catch {
      addToast({ type: 'error', message: 'Failed to load resumes' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttach = async (resumeId: string) => {
    setAttachingId(resumeId);

    try {
      const response = await fetch(`/api/applications/${applicationId}/resumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? 'Failed to attach resume');
      }

      addToast({ type: 'success', message: 'Resume attached!' });
      onAttach(resumeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to attach resume';
      addToast({ type: 'error', message });
    } finally {
      setAttachingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const availableResumes = resumes.filter((r) => !attachedResumeIds.includes(r.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ATTACH RESUME">
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Loading resumes...</div>
        ) : availableResumes.length === 0 ? (
          <div className={styles.empty}>
            <p>No resumes available to attach.</p>
            <p className={styles.hint}>
              {resumes.length > 0
                ? 'All your resumes are already attached to this application.'
                : 'Upload a resume first from the Resumes page.'}
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {availableResumes.map((resume) => (
              <div key={resume.id} className={styles.item}>
                <div className={styles.info}>
                  <span className={styles.filename}>{resume.filename}</span>
                  <span className={styles.size}>{formatFileSize(resume.fileSize)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAttach(resume.id)}
                  isLoading={attachingId === resume.id}
                  disabled={attachingId !== null}
                >
                  ATTACH
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
