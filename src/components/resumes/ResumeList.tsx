// T097: ResumeList component

'use client';

import { ResumeCard } from './ResumeCard';
import type { Resume } from '@/types/entities';
import styles from './ResumeList.module.css';

interface ResumeListProps {
  resumes: Resume[];
  onDelete?: () => void;
  emptyMessage?: string;
}

export function ResumeList({ resumes, onDelete, emptyMessage = 'No resumes uploaded yet.' }: ResumeListProps) {
  if (resumes.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {resumes.map((resume) => (
        <ResumeCard key={resume.id} resume={resume} onDelete={onDelete} />
      ))}
    </div>
  );
}
