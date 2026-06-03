/**
 * File purpose: Generic attachment preparation for support features.
 *
 * Firebase Storage is not available on our free-plan demo setup, so this file
 * currently uses a metadata-only provider. Users can still test the attachment
 * workflow: choosing files, sending them with a message, and seeing attachment
 * cards in the thread. Later, a real provider can upload the same files to
 * Firebase Storage/S3/another service without changing the message UI.
 */

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

/**
 * Metadata-only provider used for the current free-plan demo.
 *
 * It deliberately does not upload file bytes. This avoids Firebase Storage while
 * keeping the data shape close to a future real upload implementation.
 */
const demoMetadataAttachmentProvider: AttachmentProvider = {
  async prepareAttachments({ files, context }) {
    const createdAt = new Date().toISOString();

    return files.map((file) => prepareDemoAttachment({ file, context, createdAt }));
  },
};

/**
 * Single entry point for support attachments.
 *
 * Swapping this provider later is the only change needed to move from demo
 * metadata to real file storage.
 */
const activeAttachmentProvider: AttachmentProvider = demoMetadataAttachmentProvider;

/** Prepares selected files and returns serialisable attachment metadata. */
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

function prepareDemoAttachment({
  file,
  context,
  createdAt,
}: {
  file: File;
  context: UploadAttachmentContext;
  createdAt: string;
}): SupportAttachment {
  assertFileIsAllowed(file);

  const attachmentId = crypto.randomUUID();

  return {
    id: attachmentId,
    name: file.name,
    url: '',
    storagePath: '',
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    kind: getAttachmentKind(file),
    createdAt,
    provider: 'demo-metadata',
    isPreviewAvailable: false,
    ownerArea: context.area,
    ownerId: context.ownerId,
    uploadedById: context.uploadedById,
  };
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
