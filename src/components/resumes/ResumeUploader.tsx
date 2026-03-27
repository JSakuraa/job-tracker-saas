// T095: ResumeUploader component with drag-drop

'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import styles from './ResumeUploader.module.css';

interface ResumeUploaderProps {
  onUploadComplete?: () => void;
}

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF and DOCX files are allowed.';
    }
    if (file.size > MAX_SIZE) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      addToast({ type: 'error', message: error });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Step 1: Get upload URL
      const uploadUrlResponse = await fetch('/api/resumes/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!uploadUrlResponse.ok) {
        const data = await uploadUrlResponse.json();
        throw new Error(data.error?.message ?? 'Failed to get upload URL');
      }

      const { data: uploadData } = await uploadUrlResponse.json();
      setUploadProgress(30);

      // Step 2: Upload to Azure Blob Storage
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'x-ms-blob-type': 'BlockBlob',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(70);

      // Step 3: Register the upload in the database
      const registerResponse = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          blobKey: uploadData.blobKey,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        throw new Error(data.error?.message ?? 'Failed to register upload');
      }

      const { xpAwarded } = await registerResponse.json();
      setUploadProgress(100);

      if (xpAwarded) {
        addToast({ type: 'xp', message: `+${xpAwarded} XP earned!` });
      }

      addToast({ type: 'success', message: 'Resume uploaded successfully!' });

      if (onUploadComplete) {
        onUploadComplete();
      } else {
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      addToast({ type: 'error', message });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    const firstFile = files[0];
    if (files.length > 0 && firstFile) {
      uploadFile(firstFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const firstFile = files?.[0];
    if (files && files.length > 0 && firstFile) {
      uploadFile(firstFile);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`${styles.uploader} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className={styles.progressText}>UPLOADING... {uploadProgress}%</span>
        </div>
      ) : (
        <>
          <div className={styles.icon}>+</div>
          <p className={styles.text}>
            {isDragging ? 'DROP FILE HERE' : 'DRAG & DROP OR CLICK TO UPLOAD'}
          </p>
          <p className={styles.hint}>PDF or DOCX, max 10MB</p>
        </>
      )}
    </div>
  );
}
