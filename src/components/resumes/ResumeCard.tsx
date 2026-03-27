// T096: ResumeCard component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { Resume } from '@/types/entities';
import styles from './ResumeCard.module.css';

interface ResumeCardProps {
  resume: Resume;
  onDelete?: (() => void) | undefined;
  showActions?: boolean | undefined;
}

export function ResumeCard({ resume, onDelete, showActions = true }: ResumeCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'DOC';
    return 'FILE';
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/resumes/${resume.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const { data } = await response.json();

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch {
      addToast({ type: 'error', message: 'Failed to download resume' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/resumes/${resume.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? 'Failed to delete resume');
      }

      addToast({ type: 'success', message: 'Resume deleted' });

      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete resume';
      addToast({ type: 'error', message });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <Card className={styles.card}>
        <CardContent className={styles.content}>
          <div className={styles.icon}>{getFileIcon(resume.mimeType)}</div>
          <div className={styles.details}>
            <h3 className={styles.filename}>{resume.filename}</h3>
            <p className={styles.meta}>
              {formatFileSize(resume.fileSize)} • {formatDate(resume.uploadedAt)}
            </p>
          </div>
          {showActions && (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                isLoading={isDownloading}
              >
                DOWNLOAD
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                DELETE
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="DELETE RESUME"
        size="sm"
      >
        <p className={styles.deleteWarning}>
          Are you sure you want to delete &quot;{resume.filename}&quot;? This action cannot be undone.
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
    </>
  );
}
