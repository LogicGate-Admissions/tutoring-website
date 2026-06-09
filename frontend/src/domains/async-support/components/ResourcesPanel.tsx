'use client';

/**
 * File purpose: relationship-scoped shared resources panel.
 *
 * Students and tutors can upload a file during a lesson. The file goes to
 * Firebase Storage and a small metadata document is saved on the relationship.
 */

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { uploadAttachments } from '@/domains/attachments/services/attachmentUploadService';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import { useRelationshipResources } from '@/domains/async-support/hooks/useRelationshipResources';
import {
  createRelationshipResource,
  deleteRelationshipResource,
} from '@/domains/async-support/services/resourcesService';
import type {
  AsyncSupportRole,
  SharedResource,
} from '@/domains/async-support/types/asyncSupport';
import type { AuthUser } from '@/domains/auth/types/auth';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';

const RESOURCE_DRAG_MIME_TYPE = 'application/x-logicgate-resource';
const RESOURCE_DRAG_START_EVENT = 'logicgate-resource-drag-start';
const RESOURCE_DRAG_END_EVENT = 'logicgate-resource-drag-end';

type ResourcesPanelProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
};

export function ResourcesPanel({ relationshipId, viewerRole }: ResourcesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const { resources, loading, error } = useRelationshipResources(relationshipId);

  useEffect(() => subscribeToCurrentUser(setCurrentUser), []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!currentUser || files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const attachments = await uploadAttachments({
        files,
        context: {
          area: 'resources',
          ownerId: relationshipId,
          uploadedById: currentUser.id,
        },
      });

      await Promise.all(
        attachments.map((attachment) =>
          createRelationshipResource({
            relationshipId,
            createdById: currentUser.id,
            createdByRole: viewerRole,
            createdByName: currentUser.name,
            attachment,
          })
        )
      );
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : 'Could not upload this resource.'
      );
    } finally {
      setIsUploading(false);
    }
  }


  async function handleDeleteResource(resource: SharedResource) {
    const shouldDelete = window.confirm(
      `Delete "${resource.title}" from shared resources?`
    );

    if (!shouldDelete) return;

    try {
      setDeletingResourceId(resource.id);
      setUploadError(null);
      await deleteRelationshipResource(resource);
    } catch (deleteFailure) {
      setUploadError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : 'Could not delete this resource.'
      );
    } finally {
      setDeletingResourceId(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Shared resources
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Upload files for this student-tutor pair.
            </p>
          </div>
        </div>
        <Button
          className="mt-3 w-full text-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={!currentUser || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>

      {uploadError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadError}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Loading resources...
        </p>
      ) : null}

      {!loading && resources.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm leading-6 text-slate-500">
          No resources yet. Upload the first lesson material here.
        </p>
      ) : null}

      <div className="grid gap-2">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isDeleting={deletingResourceId === resource.id}
            onDelete={handleDeleteResource}
          />
        ))}
      </div>
    </div>
  );
}

function ResourceCard({
  resource,
  isDeleting,
  onDelete,
}: {
  resource: SharedResource;
  isDeleting: boolean;
  onDelete: (resource: SharedResource) => void;
}) {
  const attachment = resource.attachment;
  const url = attachment?.url ?? resource.url;
  const sizeLabel = attachment ? formatFileSize(attachment.sizeBytes) : null;
  const content = (
    <>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold uppercase',
          attachment?.kind === 'pdf'
            ? 'bg-rose-50 text-rose-700'
            : attachment?.kind === 'image'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-slate-100 text-slate-700'
        )}
      >
        {getResourceKindLabel(attachment?.kind)}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xs font-semibold text-slate-950">
          {resource.title}
        </h3>
        <p className="mt-1 truncate text-[11px] text-slate-500">
          {resource.createdByName} - {formatResourceTime(resource.createdAt)}
        </p>
        <p className="mt-1 truncate text-[11px] text-slate-400">
          {sizeLabel ? `${sizeLabel} - ` : ''}{url ? 'Click or drag to board' : 'No file link'}
        </p>
      </div>
    </>
  );

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid min-w-0 gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                RESOURCE_DRAG_MIME_TYPE,
                JSON.stringify({
                  relationshipId: resource.relationshipId,
                  resourceId: resource.id,
                  title: resource.title,
                })
              );
              event.dataTransfer.effectAllowed = 'copy';
              window.dispatchEvent(new CustomEvent(RESOURCE_DRAG_START_EVENT));
            }}
            onDragEnd={() => {
              window.dispatchEvent(new CustomEvent(RESOURCE_DRAG_END_EVENT));
            }}
            className="flex min-w-0 items-start gap-2 rounded-xl p-1 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            title="Open resource"
          >
            {content}
          </a>
        ) : (
          <div className="flex min-w-0 items-start gap-2 rounded-xl p-1">{content}</div>
        )}

        <button
          type="button"
          onClick={() => onDelete(resource)}
          disabled={isDeleting}
          className="justify-self-end rounded-full border border-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}

function getResourceKindLabel(kind?: string) {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'image') return 'IMG';
  return 'FILE';
}

function formatFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return 'Unknown size';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatResourceTime(value: string) {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
