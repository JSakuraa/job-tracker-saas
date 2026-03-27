// T175: Profile editing component
// T176: Account deletion with confirmation

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import styles from './ProfileEditor.module.css';

interface ProfileEditorProps {
  currentName: string;
}

export function ProfileEditor({ currentName }: ProfileEditorProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState(currentName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      addToast({ type: 'error', message: 'Name cannot be empty' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to update profile' });
        return;
      }

      addToast({ type: 'success', message: 'Profile updated!' });
      setIsEditing(false);
      router.refresh();
    } catch {
      addToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>EDIT PROFILE</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className={styles.form}>
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <div className={styles.actions}>
              <Button onClick={handleSave} isLoading={isSaving} size="sm">
                SAVE
              </Button>
              <Button
                onClick={() => {
                  setName(currentName);
                  setIsEditing(false);
                }}
                variant="secondary"
                size="sm"
              >
                CANCEL
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
            EDIT NAME
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function AccountDeletion() {
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      addToast({ type: 'error', message: 'Please type DELETE to confirm' });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ type: 'error', message: data.error?.message ?? 'Failed to delete account' });
        return;
      }

      addToast({ type: 'success', message: 'Account scheduled for deletion' });

      // Sign out after deletion
      await signOut({ callbackUrl: '/' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete account' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={styles.dangerCard}>
      <CardHeader>
        <CardTitle>DANGER ZONE</CardTitle>
      </CardHeader>
      <CardContent>
        {showConfirm ? (
          <div className={styles.confirmDelete}>
            <p className={styles.warning}>
              This will delete your account and all data. You have 30 days to recover your account.
            </p>
            <Input
              label="Type DELETE to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <div className={styles.actions}>
              <Button
                onClick={handleDelete}
                variant="danger"
                isLoading={isDeleting}
                disabled={confirmText !== 'DELETE'}
                size="sm"
              >
                CONFIRM DELETE
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                variant="secondary"
                size="sm"
              >
                CANCEL
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className={styles.deleteInfo}>
              Once deleted, your account will be recoverable for 30 days.
            </p>
            <Button onClick={() => setShowConfirm(true)} variant="danger" size="sm">
              DELETE ACCOUNT
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
