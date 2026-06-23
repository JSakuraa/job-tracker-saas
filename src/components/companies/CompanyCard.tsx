'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { CompanyWithCounts } from '@/types/entities';
import styles from './CompanyCard.module.css';

interface CompanyCardProps {
  company: CompanyWithCounts;
  onDelete?: () => void;
  onUpdate?: (updated: CompanyWithCounts) => void;
}

export function CompanyCard({ company, onDelete, onUpdate }: CompanyCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(company.name);
  const [isSaving, setIsSaving] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  const displayName = company.name.charAt(0).toUpperCase() + company.name.slice(1);

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim() === company.name) {
      setIsEditing(false);
      setEditName(company.name);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to rename company' });
        setEditName(company.name);
        setIsEditing(false);
        return;
      }

      addToast({ type: 'success', message: 'Company renamed' });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate({ ...company, name: data.data.name });
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to rename company' });
      setEditName(company.name);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setReferenceError(null);
    if (!confirm(`Delete "${displayName}"?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        addToast({ type: 'success', message: 'Company deleted' });
        onDelete?.();
        return;
      }

      const data = await response.json();
      if (response.status === 409 && data.error?.code === 'REFERENCE_CONFLICT') {
        const { applicationCount, connectionCount } = data.error.details ?? {};
        setReferenceError(
          `Used by ${applicationCount ?? 0} application(s) and ${connectionCount ?? 0} connection(s). Remove links first.`
        );
        return;
      }

      addToast({ type: 'error', message: data.error?.message ?? 'Failed to delete company' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete company' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={styles.card}>
      <CardContent className={styles.content}>
        <div className={styles.rankBadge}>
          {company.rank !== null ? (
            <span className={styles.ranked}>#{company.rank}</span>
          ) : (
            <span className={styles.unranked}>—</span>
          )}
        </div>

        <div className={styles.info}>
          {isEditing ? (
            <div className={styles.editRow}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') { setIsEditing(false); setEditName(company.name); }
                }}
                className={styles.nameInput}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName} isLoading={isSaving}>SAVE</Button>
              <Button size="sm" variant="secondary" onClick={() => { setIsEditing(false); setEditName(company.name); }}>×</Button>
            </div>
          ) : (
            <button className={styles.nameButton} onClick={() => setIsEditing(true)} type="button" title="Click to rename">
              {displayName}
            </button>
          )}

          <div className={styles.counts}>
            <span className={styles.countLabel}>{company.applicationCount} app{company.applicationCount !== 1 ? 's' : ''}</span>
            <span className={styles.countSep}>·</span>
            <span className={styles.countLabel}>{company.connectionCount} contact{company.connectionCount !== 1 ? 's' : ''}</span>
          </div>

          {referenceError && <p className={styles.referenceError}>{referenceError}</p>}
        </div>

        <div className={styles.actions}>
          <Button size="sm" variant="danger" onClick={handleDelete} isLoading={isDeleting}>×</Button>
        </div>
      </CardContent>
    </Card>
  );
}
