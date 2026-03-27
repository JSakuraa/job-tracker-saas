// T151: RankedEmployerList with drag-drop reordering

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RankedEmployerCard } from './RankedEmployerCard';
import { useToast } from '@/components/ui/Toast';
import type { RankedEmployer } from '@/types/entities';
import styles from './RankedEmployerList.module.css';

interface RankedEmployerListProps {
  employers: RankedEmployer[];
  onUpdate?: (() => void) | undefined;
  emptyMessage?: string | undefined;
}

export function RankedEmployerList({
  employers,
  onUpdate,
  emptyMessage = 'No ranked employers yet. Add your top choices!',
}: RankedEmployerListProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [localEmployers, setLocalEmployers] = useState(employers);

  // Update local state when props change
  if (employers !== localEmployers && !draggedId) {
    setLocalEmployers(employers);
  }

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();

      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId === targetId) {
        setDraggedId(null);
        return;
      }

      // Optimistic update
      const sourceIndex = localEmployers.findIndex((emp) => emp.id === sourceId);
      const targetIndex = localEmployers.findIndex((emp) => emp.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        setDraggedId(null);
        return;
      }

      const newOrder = [...localEmployers];
      const [removed] = newOrder.splice(sourceIndex, 1);
      if (!removed) {
        setDraggedId(null);
        return;
      }
      newOrder.splice(targetIndex, 0, removed);

      // Update local state immediately
      setLocalEmployers(newOrder.map((emp, idx) => ({ ...emp, rank: idx + 1 })));
      setDraggedId(null);

      // Send to server
      try {
        const response = await fetch('/api/rankings/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: newOrder.map((emp) => emp.id) }),
        });

        if (!response.ok) {
          // Revert on error
          setLocalEmployers(employers);
          const data = await response.json();
          addToast({ type: 'error', message: data.error?.message ?? 'Failed to reorder' });
          return;
        }

        addToast({ type: 'success', message: 'Rankings updated' });

        if (onUpdate) {
          onUpdate();
        } else {
          router.refresh();
        }
      } catch {
        setLocalEmployers(employers);
        addToast({ type: 'error', message: 'Failed to reorder rankings' });
      }
    },
    [localEmployers, employers, addToast, onUpdate, router]
  );

  const handleDelete = useCallback(() => {
    if (onUpdate) {
      onUpdate();
    } else {
      router.refresh();
    }
  }, [onUpdate, router]);

  if (localEmployers.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {localEmployers.map((employer) => (
        <RankedEmployerCard
          key={employer.id}
          employer={employer}
          onDelete={handleDelete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedId === employer.id}
        />
      ))}
    </div>
  );
}
