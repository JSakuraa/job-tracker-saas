'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { CompanyAutocomplete } from './CompanyAutocomplete';
import styles from './AddCompanyForm.module.css';

export function AddCompanyForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [existsMessage, setExistsMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companyId: '',
    rank: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setExistsMessage(null);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          rank: formData.rank ? parseInt(formData.rank, 10) : null,
          notes: formData.notes || null,
          source: 'companies_tab',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to add company' });
        return;
      }

      addToast({ type: 'success', message: 'Company added!' });
      setFormData({ companyName: '', companyId: '', rank: '', notes: '' });
      router.refresh();
    } catch {
      addToast({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ADD COMPANY</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          <CompanyAutocomplete
            label="Company Name"
            value={formData.companyName}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, companyName: value, companyId: '' }));
              setExistsMessage(null);
            }}
            onSelect={(company) => {
              setFormData((prev) => ({ ...prev, companyName: company.name, companyId: company.id }));
              setExistsMessage('Company already exists — you can rank it below.');
            }}
            onCreateNew={(name) => {
              setFormData((prev) => ({ ...prev, companyName: name, companyId: '' }));
              setExistsMessage(null);
            }}
            required
            placeholder="e.g. Acme Corp"
          />
          {existsMessage && <p className={styles.existsMessage}>{existsMessage}</p>}

          <Input
            label="Rank"
            name="rank"
            type="number"
            value={formData.rank}
            onChange={(e) => setFormData((prev) => ({ ...prev, rank: e.target.value }))}
            placeholder="Leave blank for unranked"
            min={1}
          />

          <div className={styles.field}>
            <label htmlFor="notes" className={styles.label}>Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className={styles.textarea}
              placeholder="Optional notes about this company"
              rows={3}
            />
          </div>

          <Button type="submit" isLoading={isLoading} className={styles.button}>
            ADD COMPANY
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
