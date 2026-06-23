// T075: ApplicationForm component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useXP } from '@/components/gamification';
import { CompanyAutocomplete } from '@/components/companies';
import styles from './ApplicationForm.module.css';

interface ApplicationFormProps {
  initialData?: {
    jobTitle: string;
    companyName: string;
    dateApplied: string;
    referralName?: string | null;
    referralContact?: string | null;
    jobDescription?: string | null;
  };
  applicationId?: string;
  onSuccess?: () => void;
}

export function ApplicationForm({ initialData, applicationId, onSuccess }: ApplicationFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { refreshXP } = useXP();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    jobTitle: string;
    companyName: string;
    companyId: string;
    dateApplied: string;
    referralName: string;
    referralContact: string;
    jobDescription: string;
  }>({
    jobTitle: initialData?.jobTitle ?? '',
    companyName: initialData?.companyName ?? '',
    companyId: '',
    dateApplied: initialData?.dateApplied ?? new Date().toISOString().slice(0, 10),
    referralName: initialData?.referralName ?? '',
    referralContact: initialData?.referralContact ?? '',
    jobDescription: initialData?.jobDescription ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const url = applicationId ? `/api/applications/${applicationId}` : '/api/applications';
      const method = applicationId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          companyId: formData.companyId || undefined,
          dateApplied: new Date(formData.dateApplied).toISOString(),
          referralName: formData.referralName || null,
          referralContact: formData.referralContact || null,
          jobDescription: formData.jobDescription || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? 'Failed to save application');
        return;
      }

      // Show XP toast if XP was awarded
      if (data.xpAwarded) {
        addToast({
          type: 'xp',
          message: `+${data.xpAwarded} XP earned!`,
        });
        // Refresh XP display
        refreshXP();
      }

      addToast({
        type: 'success',
        message: applicationId ? 'Application updated!' : 'Application created!',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/applications/${data.data.id}`);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>{applicationId ? 'EDIT APPLICATION' : 'NEW APPLICATION'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            <Input
              label="Job Title"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              required
              placeholder="e.g. Software Engineer"
            />

            <CompanyAutocomplete
              label="Company Name"
              value={formData.companyName}
              onChange={(value) => setFormData((prev) => ({ ...prev, companyName: value, companyId: '' }))}
              onSelect={(company) => setFormData((prev) => ({ ...prev, companyName: company.name, companyId: company.id }))}
              onCreateNew={(name) => setFormData((prev) => ({ ...prev, companyName: name, companyId: '' }))}
              required
              placeholder="e.g. Acme Corp"
            />

            <Input
              label="Date Applied"
              name="dateApplied"
              type="date"
              value={formData.dateApplied}
              onChange={handleChange}
              required
            />

            <Input
              label="Referral Name"
              name="referralName"
              value={formData.referralName}
              onChange={handleChange}
              placeholder="Optional"
            />

            <Input
              label="Referral Contact"
              name="referralContact"
              value={formData.referralContact}
              onChange={handleChange}
              placeholder="Optional (email or phone)"
            />
          </div>

          <div className={styles.textareaWrapper}>
            <label htmlFor="jobDescription" className={styles.label}>
              Job Description
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Paste the job description here (optional)"
              rows={6}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            CANCEL
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {applicationId ? 'SAVE CHANGES' : 'CREATE APPLICATION'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
