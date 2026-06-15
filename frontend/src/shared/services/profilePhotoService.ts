/**
 * File purpose: Upload student/tutor face photos to Firebase Storage.
 */

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/shared/lib/firebase';

const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadProfilePhoto({
  userId,
  file,
}: {
  userId: string;
  file: File;
}) {
  assertProfilePhotoIsAllowed(file);

  const photoId = crypto.randomUUID();
  const fileExtension = getSafeExtension(file);
  const storagePath = `profilePhotos/${userId}/${photoId}/face.${fileExtension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return {
    url: await getDownloadURL(storageRef),
    storagePath,
  };
}

function assertProfilePhotoIsAllowed(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file for the profile photo.');
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
    throw new Error('Profile photos must be 5MB or smaller.');
  }
}

function getSafeExtension(file: File) {
  const nameExtension = file.name.split('.').pop()?.toLowerCase();

  if (nameExtension && /^[a-z0-9]{2,5}$/.test(nameExtension)) {
    return nameExtension;
  }

  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';

  return 'jpg';
}
