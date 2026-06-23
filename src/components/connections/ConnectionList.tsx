'use client';

import { useState } from 'react';
import { ConnectionCard } from './ConnectionCard';
import type { ConnectionWithCompany } from '@/types/entities';
import styles from './ConnectionList.module.css';

interface ConnectionListProps {
  connections: ConnectionWithCompany[];
}

export function ConnectionList({ connections: initialConnections }: ConnectionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'established_connection' | 'cold_outreach'>('all');
  const [connections, setConnections] = useState(initialConnections);

  const filtered = connections.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      c.fullName.toLowerCase().includes(query) ||
      (c.company?.name.toLowerCase().includes(query) ?? false);
    const matchesType = typeFilter === 'all' || c.relationshipType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdate = (updated: ConnectionWithCompany) => {
    setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or company…"
          className={styles.searchInput}
          aria-label="Search connections"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className={styles.typeFilter}
          aria-label="Filter by relationship type"
        >
          <option value="all">All Types</option>
          <option value="established_connection">Connected</option>
          <option value="cold_outreach">Cold Outreach</option>
        </select>
      </div>

      {connections.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No connections yet. Add your first contact!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No connections match your search.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onDelete={() => handleDelete(connection.id)}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
