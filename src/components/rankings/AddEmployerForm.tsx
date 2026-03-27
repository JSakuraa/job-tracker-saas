// T152: AddEmployerForm component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import styles from './AddEmployerForm.module.css';

interface AddEmployerFormProps {
  onSuccess?: (() => void) | undefined;
}

export function AddEmployerForm({ onSuccess }: AddEmployerFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      addToast({ type: 'error', message: 'Company name is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to add employer' });
        return;
      }

      addToast({ type: 'success', message: 'Employer added to rankings!' });
      setCompanyName('');
      setNotes('');

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to add employer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className={styles.content}>
        <h2 className={styles.title}>ADD EMPLOYER</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name"
            required
          />

          <div className={styles.field}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why do you like this company?"
              rows={3}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} className={styles.button}>
            ADD TO RANKINGS
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
