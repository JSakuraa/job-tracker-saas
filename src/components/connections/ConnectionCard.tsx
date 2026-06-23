'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { ConnectionWithCompany } from '@/types/entities';
import styles from './ConnectionCard.module.css';

interface ConnectionCardProps {
  connection: ConnectionWithCompany;
  onDelete?: () => void;
  onUpdate?: (updated: ConnectionWithCompany) => void;
}

export function ConnectionCard({ connection, onDelete, onUpdate }: ConnectionCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingConnected, setIsMarkingConnected] = useState(false);
  const [localRelType, setLocalRelType] = useState(connection.relationshipType);

  const notesPreview = connection.notes
    ? connection.notes.length > 80
      ? connection.notes.slice(0, 80) + '…'
      : connection.notes
    : null;

  const handleMarkConnected = async () => {
    setIsMarkingConnected(true);
    try {
      const response = await fetch(`/api/connections/${connection.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipType: 'established_connection' }),
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to update status' });
        return;
      }

      setLocalRelType('established_connection');
      addToast({ type: 'success', message: `${connection.fullName} marked as connected!` });

      if (onUpdate) {
        onUpdate({ ...connection, relationshipType: 'established_connection' });
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setIsMarkingConnected(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${connection.fullName} from your connections?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/connections/${connection.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to delete connection' });
        return;
      }

      addToast({ type: 'success', message: 'Connection removed' });
      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to delete connection' });
    } finally {
      setIsDeleting(false);
    }
  };

  const isColdOutreach = localRelType === 'cold_outreach';

  return (
    <Card className={styles.card}>
      <CardContent className={styles.content}>
        <div className={styles.header}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{connection.fullName}</h3>
            <span className={`${styles.badge} ${isColdOutreach ? styles.badgeCold : styles.badgeConnected}`}>
              {isColdOutreach ? 'COLD OUTREACH' : 'CONNECTED'}
            </span>
          </div>
          {connection.company && (
            <p className={styles.company}>{connection.company.name.charAt(0).toUpperCase() + connection.company.name.slice(1)}</p>
          )}
        </div>

        <div className={styles.contacts}>
          {connection.email && (
            <a href={`mailto:${connection.email}`} className={styles.contactLink}>
              ✉ {connection.email}
            </a>
          )}
          {connection.linkedinUrl && (
            <a href={connection.linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
              in {connection.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
            </a>
          )}
          {connection.phoneNumber && (
            <a href={`tel:${connection.phoneNumber}`} className={styles.contactLink}>
              ☎ {connection.phoneNumber}
            </a>
          )}
        </div>

        {notesPreview && <p className={styles.notes}>{notesPreview}</p>}

        <div className={styles.actions}>
          {isColdOutreach && (
            <Button size="sm" onClick={handleMarkConnected} isLoading={isMarkingConnected}>
              MARK AS CONNECTED
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => router.push(`/connections/${connection.id}/edit` as Route)}>
            EDIT
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            ×
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
