'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyCard } from './CompanyCard';
import { useToast } from '@/components/ui/Toast';
import type { CompanyWithCounts } from '@/types/entities';
import styles from './CompanyList.module.css';

interface CompanyListProps {
  companies: CompanyWithCounts[];
}

export function CompanyList({ companies: initialCompanies }: CompanyListProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [companies, setCompanies] = useState(initialCompanies);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const ranked = companies.filter((c) => c.rank !== null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const unranked = companies.filter((c) => c.rank === null).sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdate = (updated: CompanyWithCounts) => {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

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

      const sourceIndex = ranked.findIndex((c) => c.id === sourceId);
      const targetIndex = ranked.findIndex((c) => c.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        setDraggedId(null);
        return;
      }

      const newOrder = [...ranked];
      const [removed] = newOrder.splice(sourceIndex, 1);
      if (!removed) { setDraggedId(null); return; }
      newOrder.splice(targetIndex, 0, removed);
      const reordered = newOrder.map((c, i) => ({ ...c, rank: i + 1 }));

      setCompanies((prev) => [
        ...reordered,
        ...prev.filter((c) => c.rank === null),
      ]);
      setDraggedId(null);

      try {
        const response = await fetch('/api/companies/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: newOrder.map((c) => c.id) }),
        });

        if (!response.ok) {
          setCompanies(initialCompanies);
          addToast({ type: 'error', message: 'Failed to reorder companies' });
          return;
        }

        router.refresh();
      } catch {
        setCompanies(initialCompanies);
        addToast({ type: 'error', message: 'Failed to reorder companies' });
      }
    },
    [ranked, initialCompanies, addToast, router]
  );

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>RANKED</h2>
        {ranked.length === 0 ? (
          <p className={styles.emptyText}>No ranked companies yet.</p>
        ) : (
          <div className={styles.list}>
            {ranked.map((company) => (
              <div
                key={company.id}
                draggable
                onDragStart={(e) => handleDragStart(e, company.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, company.id)}
                className={draggedId === company.id ? styles.dragging : ''}
              >
                <CompanyCard
                  company={company}
                  onDelete={() => handleDelete(company.id)}
                  onUpdate={handleUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>UNRANKED</h2>
        {unranked.length === 0 ? (
          <p className={styles.emptyText}>No unranked companies.</p>
        ) : (
          <div className={styles.list}>
            {unranked.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onDelete={() => handleDelete(company.id)}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
