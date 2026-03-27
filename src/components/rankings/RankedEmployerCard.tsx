// T150: RankedEmployerCard component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { RankedEmployer } from '@/types/entities';
import styles from './RankedEmployerCard.module.css';

interface RankedEmployerCardProps {
  employer: RankedEmployer;
  onDelete?: (() => void) | undefined;
  onDragStart?: ((e: React.DragEvent, id: string) => void) | undefined;
  onDragEnd?: (() => void) | undefined;
  onDragOver?: ((e: React.DragEvent) => void) | undefined;
  onDrop?: ((e: React.DragEvent, id: string) => void) | undefined;
  isDragging?: boolean | undefined;
}

export function RankedEmployerCard({
  employer,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging = false,
}: RankedEmployerCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(employer.notes ?? '');

  const handleDelete = async () => {
    if (!confirm('Remove this employer from your rankings?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/rankings/${employer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to remove employer' });
        return;
      }

      addToast({ type: 'success', message: 'Employer removed from rankings' });

      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to remove employer' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`/api/rankings/${employer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to save notes' });
        return;
      }

      addToast({ type: 'success', message: 'Notes saved' });
      setIsEditing(false);
      router.refresh();
    } catch {
      addToast({ type: 'error', message: 'Failed to save notes' });
    }
  };

  const displayName = employer.companyName.charAt(0).toUpperCase() + employer.companyName.slice(1);

  return (
    <Card
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, employer.id)}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => onDragOver?.(e)}
      onDrop={(e) => onDrop?.(e, employer.id)}
    >
      <CardContent className={styles.content}>
        <div className={styles.rankBadge}>#{employer.rank}</div>

        <div className={styles.info}>
          <h3 className={styles.name}>{displayName}</h3>

          {isEditing ? (
            <div className={styles.editNotes}>
              <textarea
                className={styles.notesInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this employer..."
                rows={3}
              />
              <div className={styles.editActions}>
                <Button size="sm" onClick={handleSaveNotes}>
                  SAVE
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setNotes(employer.notes ?? '');
                    setIsEditing(false);
                  }}
                >
                  CANCEL
                </Button>
              </div>
            </div>
          ) : (
            <>
              {employer.notes && <p className={styles.notes}>{employer.notes}</p>}
              <button
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
                type="button"
              >
                {employer.notes ? 'Edit notes' : 'Add notes'}
              </button>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <span className={styles.dragHandle} title="Drag to reorder">
            ⋮⋮
          </span>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            ×
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
