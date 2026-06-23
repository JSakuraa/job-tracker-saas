'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { CompanyAutocomplete } from '@/components/companies';
import styles from './AddConnectionForm.module.css';

export function AddConnectionForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    linkedinUrl: '',
    phoneNumber: '',
    companyName: '',
    companyId: '',
    relationshipType: 'cold_outreach' as 'established_connection' | 'cold_outreach',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email || null,
          linkedinUrl: formData.linkedinUrl || null,
          phoneNumber: formData.phoneNumber || null,
          companyId: formData.companyId || null,
          companyName: !formData.companyId && formData.companyName ? formData.companyName : null,
          relationshipType: formData.relationshipType,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to add connection' });
        return;
      }

      addToast({ type: 'success', message: 'Connection added!' });
      setFormData({
        fullName: '',
        email: '',
        linkedinUrl: '',
        phoneNumber: '',
        companyName: '',
        companyId: '',
        relationshipType: 'cold_outreach',
        notes: '',
      });
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
        <CardTitle>ADD CONNECTION</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="e.g. Jane Smith"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Optional"
          />

          <Input
            label="LinkedIn URL"
            name="linkedinUrl"
            type="url"
            value={formData.linkedinUrl}
            onChange={handleChange}
            placeholder="Optional"
          />

          <Input
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Optional"
          />

          <CompanyAutocomplete
            label="Company"
            value={formData.companyName}
            onChange={(value) => setFormData((prev) => ({ ...prev, companyName: value, companyId: '' }))}
            onSelect={(company) => setFormData((prev) => ({ ...prev, companyName: company.name, companyId: company.id }))}
            onCreateNew={(name) => setFormData((prev) => ({ ...prev, companyName: name, companyId: '' }))}
            placeholder="Optional"
          />

          <div className={styles.field}>
            <label htmlFor="relationshipType" className={styles.label}>
              Relationship Type <span className={styles.required}>*</span>
            </label>
            <select
              id="relationshipType"
              name="relationshipType"
              value={formData.relationshipType}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="cold_outreach">Cold Outreach</option>
              <option value="established_connection">Established Connection</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="notes" className={styles.label}>
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="How did you meet? Any context... (optional)"
              rows={3}
            />
          </div>

          <Button type="submit" isLoading={isLoading} className={styles.button}>
            ADD CONNECTION
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
