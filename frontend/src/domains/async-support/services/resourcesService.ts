/**
 * File purpose: Firestore service functions for relationship resources.
 *
 * Resources belong to one student-tutor relationship:
 * studentTutorRelationships/{relationshipId}/resources/{resourceId}
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type {
  AsyncSupportRole,
  SharedResource,
  SupportAttachment,
} from '@/domains/async-support/types/asyncSupport';

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';
const RESOURCES_SUBCOLLECTION = 'resources';

type CreateRelationshipResourceInput = {
  relationshipId: string;
  createdById: string;
  createdByRole: AsyncSupportRole;
  createdByName: string;
  attachment: SupportAttachment;
};

function getResourcesCollection(relationshipId: string) {
  return collection(
    db,
    RELATIONSHIPS_COLLECTION,
    relationshipId,
    RESOURCES_SUBCOLLECTION
  );
}

/** Subscribes to relationship resources, newest first. */
export function subscribeToRelationshipResources({
  relationshipId,
  onChange,
  onError,
}: {
  relationshipId: string;
  onChange: (resources: SharedResource[]) => void;
  onError?: (error: Error) => void;
}) {
  return onSnapshot(
    query(getResourcesCollection(relationshipId), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onChange(
        snapshot.docs.map((resourceDoc) =>
          mapSharedResourceSnapshot(resourceDoc.id, resourceDoc.data())
        )
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}

/** Creates a relationship resource document after the file has been uploaded. */
export async function createRelationshipResource(
  input: CreateRelationshipResourceInput
): Promise<SharedResource> {
  const now = new Date().toISOString();
  const resourceData = {
    relationshipId: input.relationshipId,
    createdById: input.createdById,
    createdByRole: input.createdByRole,
    createdByName: input.createdByName,
    title: input.attachment.name,
    description: '',
    type: 'file' as const,
    url: input.attachment.url,
    attachment: input.attachment,
    createdAt: now,
    updatedAt: now,
  };

  const resourceRef = await addDoc(
    getResourcesCollection(input.relationshipId),
    resourceData
  );

  await updateResourceCount(input.relationshipId);

  return {
    id: resourceRef.id,
    ...resourceData,
  };
}

async function updateResourceCount(relationshipId: string) {
  // Best-effort dashboard summary. Firestore rules already protect the subcollection;
  // if this parent update is blocked by older rules, the upload itself can still work.
  try {
    const snapshot = await getDocs(getResourcesCollection(relationshipId));
    await updateDoc(doc(db, RELATIONSHIPS_COLLECTION, relationshipId), {
      resourceCount: snapshot.size,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Keep resource creation resilient; card counters can be refreshed later.
  }
}

function mapSharedResourceSnapshot(
  id: string,
  data: Record<string, unknown>
): SharedResource {
  return {
    id,
    relationshipId: String(data.relationshipId ?? ''),
    createdById: String(data.createdById ?? ''),
    createdByRole: normaliseRole(data.createdByRole),
    createdByName: String(data.createdByName ?? 'Unknown user'),
    title: String(data.title ?? 'Untitled resource'),
    description:
      typeof data.description === 'string' && data.description.length > 0
        ? data.description
        : undefined,
    type: data.type === 'link' || data.type === 'note' ? data.type : 'file',
    url: typeof data.url === 'string' ? data.url : undefined,
    attachment: normaliseAttachment(data.attachment),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

function normaliseRole(role: unknown): AsyncSupportRole {
  return role === 'tutor' ? 'tutor' : 'student';
}

function normaliseAttachment(value: unknown): SupportAttachment | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const data = value as Record<string, unknown>;
  const url = String(data.url ?? '');
  const name = String(data.name ?? 'Resource');

  if (!url) return undefined;

  return {
    id: String(data.id ?? crypto.randomUUID()),
    name,
    url,
    storagePath: String(data.storagePath ?? ''),
    contentType: String(data.contentType ?? 'application/octet-stream'),
    sizeBytes: Number(data.sizeBytes ?? 0),
    kind:
      data.kind === 'image' || data.kind === 'pdf' || data.kind === 'file'
        ? data.kind
        : 'file',
    createdAt: String(data.createdAt ?? ''),
    provider:
      data.provider === 'demo-metadata' ||
      data.provider === 'firebase-storage' ||
      data.provider === 'external-url'
        ? data.provider
        : undefined,
    isPreviewAvailable:
      typeof data.isPreviewAvailable === 'boolean'
        ? data.isPreviewAvailable
        : Boolean(url),
    ownerArea: typeof data.ownerArea === 'string' ? data.ownerArea : undefined,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
    uploadedById:
      typeof data.uploadedById === 'string' ? data.uploadedById : undefined,
  };
}
