// T139: GoalForm component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import styles from './GoalForm.module.css';

interface GoalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TARGET_TYPES = [
  { value: 'application_created', label: 'Submit Applications' },
  { value: 'status_updated', label: 'Update Statuses' },
  { value: 'resume_uploaded', label: 'Upload Resumes' },
];

export function GoalForm({ onSuccess, onCancel }: GoalFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetType: 'application_created',
    targetCount: 5,
    deadline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'targetCount' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          targetType: formData.targetType,
          targetCount: formData.targetCount,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? 'Failed to create goal');
        return;
      }

      addToast({ type: 'success', message: 'Goal created!' });

      if (onSuccess) {
        onSuccess();
      } else {
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
        <CardTitle>CREATE GOAL</CardTitle>
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
              label="Goal Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Apply to 10 jobs this week"
            />

            <div className={styles.field}>
              <label htmlFor="targetType" className={styles.label}>
                Goal Type
              </label>
              <select
                id="targetType"
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
                className={styles.select}
              >
                {TARGET_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Target Count"
              name="targetCount"
              type="number"
              min={1}
              value={formData.targetCount}
              onChange={handleChange}
              required
            />

            <Input
              label="Deadline (Optional)"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <div className={styles.textareaWrapper}>
            <label htmlFor="description" className={styles.label}>
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Add more details about your goal..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              CANCEL
            </Button>
          )}
          <Button type="submit" isLoading={isLoading}>
            CREATE GOAL
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
