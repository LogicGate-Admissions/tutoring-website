/**
 * File purpose: Upload support attachments to Firebase Storage.
 *
 * Files are stored under support/{area}/{ownerId}/{attachmentId}/{filename}
 * and the returned metadata is saved on the parent Firestore document.
 */

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/shared/lib/firebase';
import type {
  SupportAttachment,
  SupportAttachmentKind,
} from '@/domains/async-support/types/asyncSupport';

export type UploadAttachmentContext = {
  /** Product area that owns this attachment, e.g. messages/resources/questions. */
  area: string;
  /** Parent entity id, e.g. relationship id. */
  ownerId: string;
  /** Current signed-in user id. */
  uploadedById: string;
};

export type AttachmentProvider = {
  prepareAttachments(input: {
    files: File[];
    context: UploadAttachmentContext;
  }): Promise<SupportAttachment[]>;
};

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

const firebaseStorageAttachmentProvider: AttachmentProvider = {
  async prepareAttachments({ files, context }) {
    const createdAt = new Date().toISOString();

    return Promise.all(
      files.map((file) =>
        uploadAttachmentFile({ file, context, createdAt })
      )
    );
  },
};

const activeAttachmentProvider: AttachmentProvider =
  firebaseStorageAttachmentProvider;

/** Prepares selected files and uploads them to Firebase Storage. */
export async function uploadAttachments({
  files,
  context,
}: {
  files: File[];
  context: UploadAttachmentContext;
}): Promise<SupportAttachment[]> {
  assertAttachmentSelectionIsAllowed(files);
  return activeAttachmentProvider.prepareAttachments({ files, context });
}

async function uploadAttachmentFile({
  file,
  context,
  createdAt,
}: {
  file: File;
  context: UploadAttachmentContext;
  createdAt: string;
}): Promise<SupportAttachment> {
  assertFileIsAllowed(file);

  const attachmentId = crypto.randomUUID();
  const safeName = sanitiseFileName(file.name);
  const storagePath = `support/${context.area}/${context.ownerId}/${attachmentId}/${safeName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  const url = await getDownloadURL(storageRef);

  return {
    id: attachmentId,
    name: file.name,
    url,
    storagePath,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    kind: getAttachmentKind(file),
    createdAt,
    provider: 'firebase-storage',
    isPreviewAvailable: true,
    ownerArea: context.area,
    ownerId: context.ownerId,
    uploadedById: context.uploadedById,
  };
}

function sanitiseFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  return base || 'file';
}

function assertAttachmentSelectionIsAllowed(files: File[]) {
  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new Error(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`);
  }
}

function assertFileIsAllowed(file: File) {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error('Files must be 10MB or smaller.');
  }
}

function getAttachmentKind(file: File): SupportAttachmentKind {
  if (file.type.startsWith('image/')) {
    return 'image';
  }

  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }

  return 'file';
}
