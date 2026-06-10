'use client';

/**
 * File purpose: relationship-scoped shared resources panel.
 *
 * Students and tutors can upload a file during a lesson. The file goes to
 * Firebase Storage and a small metadata document is saved on the relationship.
 */

import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent as ReactDragEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
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
import { getFilesFromClipboard } from '@/shared/utils/clipboardFiles';

const RESOURCE_DRAG_MIME_TYPE = 'application/x-logicgate-resource';
const RESOURCE_DRAG_START_EVENT = 'logicgate-resource-drag-start';
const RESOURCE_DRAG_END_EVENT = 'logicgate-resource-drag-end';

type ResourcesPanelMode = 'full' | 'embedded';

type ResourcesPanelProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
  mode?: ResourcesPanelMode;
  enableBoardDrag?: boolean;
};

export function ResourcesPanel({
  relationshipId,
  viewerRole,
  mode = 'full',
  enableBoardDrag = false,
}: ResourcesPanelProps) {
  const isEmbedded = mode === 'embedded';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const { resources, loading, error } = useRelationshipResources(relationshipId);

  useEffect(() => subscribeToCurrentUser(setCurrentUser), []);

  async function uploadResourceFiles(files: File[]) {
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    uploadResourceFiles(files);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const files = getFilesFromClipboard(event.clipboardData);
    if (files.length === 0) return;

    event.preventDefault();
    uploadResourceFiles(files);
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
    <div
      className={cn('grid min-w-0 outline-none', isEmbedded ? 'gap-3' : 'gap-4')}
      tabIndex={0}
      onPaste={handlePaste}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={cn(
          'rounded-2xl border border-slate-200 bg-white',
          isEmbedded ? 'p-3' : 'p-5'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Shared resources
            </p>
            <p
              className={cn(
                'mt-1 leading-5 text-slate-500',
                isEmbedded ? 'text-xs' : 'text-sm'
              )}
            >
              Upload files for this student-tutor pair. You can also paste screenshots here.
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
            mode={mode}
            enableBoardDrag={enableBoardDrag}
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
  mode,
  enableBoardDrag,
}: {
  resource: SharedResource;
  isDeleting: boolean;
  onDelete: (resource: SharedResource) => void;
  mode: ResourcesPanelMode;
  enableBoardDrag: boolean;
}) {
  const attachment = resource.attachment;
  const url = attachment?.url ?? resource.url;
  const sizeLabel = attachment ? formatFileSize(attachment.sizeBytes) : null;
  const isEmbedded = mode === 'embedded';
  const helperText = url
    ? enableBoardDrag
      ? 'Click or drag to board'
      : 'Click to open'
    : 'No file link';

  function handleResourceDragStart(event: ReactDragEvent<HTMLAnchorElement>) {
    if (!enableBoardDrag) return;

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
  }

  function handleResourceDragEnd() {
    if (!enableBoardDrag) return;

    window.dispatchEvent(new CustomEvent(RESOURCE_DRAG_END_EVENT));
  }

  const resourceDetails = (
    <div
      className={cn(
        'flex min-w-0 items-start rounded-xl transition',
        url && 'hover:bg-slate-50',
        isEmbedded ? 'gap-2 p-1' : 'gap-3 p-2'
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl font-bold uppercase',
          isEmbedded ? 'h-8 w-8 text-[10px]' : 'h-11 w-11 text-xs',
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
        <h3
          className={cn(
            'truncate font-semibold text-slate-950',
            isEmbedded ? 'text-xs' : 'text-sm'
          )}
        >
          {resource.title}
        </h3>
        <p
          className={cn(
            'mt-1 truncate text-slate-500',
            isEmbedded ? 'text-[11px]' : 'text-xs'
          )}
        >
          {resource.createdByName} - {formatResourceTime(resource.createdAt)}
        </p>
        <p
          className={cn(
            'mt-1 truncate text-slate-400',
            isEmbedded ? 'text-[11px]' : 'text-xs'
          )}
        >
          {sizeLabel ? `${sizeLabel} - ` : ''}{helperText}
        </p>
      </div>
    </div>
  );

  const cardContent = (
    <>
      {url && attachment ? (
        <ResourcePreview
          attachmentName={attachment.name}
          attachmentKind={attachment.kind}
          url={url}
          isEmbedded={isEmbedded}
        />
      ) : null}
      {resourceDetails}
    </>
  );

  return (
    <article
      className={cn(
        'min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm',
        isEmbedded ? 'p-2' : 'p-4'
      )}
    >
      <div className="grid min-w-0 gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            draggable={enableBoardDrag}
            onDragStart={handleResourceDragStart}
            onDragEnd={handleResourceDragEnd}
            className="block min-w-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300"
            title="Open resource"
          >
            {cardContent}
          </a>
        ) : (
          <div className="block min-w-0 rounded-xl">{cardContent}</div>
        )}

        <button
          type="button"
          onClick={() => onDelete(resource)}
          disabled={isDeleting}
          className={cn(
            'justify-self-end rounded-full border border-rose-100 font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60',
            isEmbedded ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
          )}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}

function ResourcePreview({
  attachmentName,
  attachmentKind,
  url,
  isEmbedded,
}: {
  attachmentName: string;
  attachmentKind: string;
  url: string;
  isEmbedded: boolean;
}) {
  if (attachmentKind === 'image') {
    return (
      <div className="mb-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={attachmentName}
          className={cn(
            'w-full object-contain',
            isEmbedded ? 'max-h-40' : 'max-h-72'
          )}
        />
      </div>
    );
  }

  if (attachmentKind === 'pdf') {
    return (
      <div
        className={cn(
          'mb-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-100',
          isEmbedded ? 'h-40' : 'h-72'
        )}
      >
        <iframe
          title={`First page preview of ${attachmentName}`}
          src={getPdfPreviewUrl(url)}
          className="pointer-events-none h-full w-full border-0"
        />
      </div>
    );
  }

  return null;
}

function getPdfPreviewUrl(url: string) {
  return `${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
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
