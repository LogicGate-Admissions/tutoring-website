'use client';

/**
 * File purpose: Small reusable profile-photo uploader for student/tutor setup.
 */

import { ChangeEvent, useRef, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { ProfileAvatar } from '@/shared/components/ProfileAvatar';
import { uploadProfilePhoto } from '@/shared/services/profilePhotoService';

type ProfilePhotoUploaderProps = {
  userId?: string;
  name: string;
  photoUrl?: string;
  label?: string;
  helperText?: string;
  onUploaded: (photoUrl: string) => void;
};

export function ProfilePhotoUploader({
  userId,
  name,
  photoUrl,
  label = 'Profile photo',
  helperText = 'Upload a clear face photo so students and tutors recognise each other across the platform.',
  onUploaded,
}: ProfilePhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !userId) {
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const uploadedPhoto = await uploadProfilePhoto({ userId, file });
      onUploaded(uploadedPhoto.url);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not upload profile photo.',
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={name} photoUrl={photoUrl} size="xl" />
          <div>
            <p className="text-sm font-semibold text-slate-950">{label}</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
              {helperText}
            </p>
            {error ? (
              <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!userId || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? 'Uploading...' : photoUrl ? 'Change photo' : 'Upload photo'}
          </Button>
        </div>
      </div>
    </section>
  );
}
