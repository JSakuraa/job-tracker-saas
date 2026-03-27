'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import styles from './ApplicationFilters.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'ALL' },
  { value: 'applied', label: 'APPLIED' },
  { value: 'phone_screen', label: 'PHONE SCREEN' },
  { value: 'technical_interview', label: 'TECHNICAL' },
  { value: 'onsite', label: 'ONSITE' },
  { value: 'offer', label: 'OFFER' },
  { value: 'accepted', label: 'ACCEPTED' },
  { value: 'rejected', label: 'REJECTED' },
  { value: 'withdrawn', label: 'WITHDRAWN' },
];

interface ApplicationFiltersProps {
  stats: Record<string, number>;
  currentStatus?: string | undefined;
}

export function ApplicationFilters({ stats, currentStatus = '' }: ApplicationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page'); // Reset to page 1

    startTransition(() => {
      router.push(`/applications?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    params.delete('page'); // Reset to page 1

    startTransition(() => {
      router.push(`/applications?${params.toString()}`);
    });
  };

  return (
    <div className={`${styles.filters} ${isPending ? styles.pending : ''}`}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <Input
          placeholder="Search by job title or company..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </form>

      <div className={styles.statusFilters}>
        {STATUS_OPTIONS.map((option) => {
          const count = option.value ? (stats[option.value] ?? 0) : Object.values(stats).reduce((a, b) => a + b, 0);
          const isActive = currentStatus === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              className={`${styles.statusButton} ${isActive ? styles.active : ''}`}
            >
              <span>{option.label}</span>
              {count > 0 && (
                <Badge variant={isActive ? 'info' : 'default'} size="sm">
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
