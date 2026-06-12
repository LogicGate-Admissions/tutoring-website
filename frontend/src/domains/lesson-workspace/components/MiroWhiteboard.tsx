'use client';

/**
 * File purpose: embed the persistent Miro board for a relationship workspace.
 *
 * The component asks a server route to create or reuse the Miro board. It also
 * accepts dragged shared resources and asks the server to place them onto the
 * Miro board through the Miro REST API.
 */

import { DragEvent, useEffect, useRef, useState } from 'react';
import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';

type MiroWhiteboardProps = {
  relationshipId: string;
};

type MiroBoardState =
  | { relationshipId: string | null; status: 'loading' }
  | {
      relationshipId: string;
      status: 'ready';
      miroBoardUrl: string;
      miroEmbedUrl: string;
    }
  | { relationshipId: string; status: 'error'; message: string };

type EnsureBoardResponse = {
  miroBoardId?: string;
  miroBoardUrl?: string;
  miroEmbedUrl?: string;
  reusedExistingBoard?: boolean;
  miroEditorInviteError?: string;
  error?: string;
};

type DraggedResourcePayload = {
  relationshipId: string;
  resourceId?: string;
  title: string;
  url?: string;
  contentType?: string;
  kind?: string;
  sizeBytes?: number;
};

type AddResourceResponse = {
  miroItemId?: string;
  miroItemType?: string;
  error?: string;
};

const RESOURCE_DRAG_MIME_TYPE = 'application/x-logicgate-resource';
const RESOURCE_DRAG_START_EVENT = 'logicgate-resource-drag-start';
const RESOURCE_DRAG_END_EVENT = 'logicgate-resource-drag-end';
const BOARD_COORDINATE_SCALE = 1.6;
const ensureBoardRequests = new Map<string, Promise<EnsureBoardResponse>>();

export function MiroWhiteboard({ relationshipId }: MiroWhiteboardProps) {
  const boardAreaRef = useRef<HTMLDivElement | null>(null);
  const [boardState, setBoardState] = useState<MiroBoardState>({
    relationshipId: null,
    status: 'loading',
  });
  const [isResourceDragActive, setIsResourceDragActive] = useState(false);
  const [isDraggingResourceOverBoard, setIsDraggingResourceOverBoard] =
    useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [dropMessage, setDropMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleResourceDragStart() {
      setIsResourceDragActive(true);
    }

    function handleResourceDragEnd() {
      setIsResourceDragActive(false);
      setIsDraggingResourceOverBoard(false);
    }

    window.addEventListener(RESOURCE_DRAG_START_EVENT, handleResourceDragStart);
    window.addEventListener(RESOURCE_DRAG_END_EVENT, handleResourceDragEnd);
    window.addEventListener('drop', handleResourceDragEnd);

    return () => {
      window.removeEventListener(RESOURCE_DRAG_START_EVENT, handleResourceDragStart);
      window.removeEventListener(RESOURCE_DRAG_END_EVENT, handleResourceDragEnd);
      window.removeEventListener('drop', handleResourceDragEnd);
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function ensureBoard() {
      try {
        const data = await requestMiroBoard(relationshipId);

        if (!isActive) return;

        if (!data.miroEmbedUrl || !data.miroBoardUrl) {
          setBoardState({
            relationshipId,
            status: 'error',
            message: data.error || 'Could not load the Miro whiteboard.',
          });
          return;
        }

        setBoardState({
          relationshipId,
          status: 'ready',
          miroBoardUrl: data.miroBoardUrl,
          miroEmbedUrl: data.miroEmbedUrl,
        });
      } catch (error) {
        if (!isActive) return;

        setBoardState({
          relationshipId,
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Could not connect to the Miro whiteboard service.',
        });
      }
    }

    ensureBoard();

    return () => {
      isActive = false;
    };
  }, [relationshipId]);

  const isLoading =
    boardState.status === 'loading' || boardState.relationshipId !== relationshipId;

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsResourceDragActive(false);
    setIsDraggingResourceOverBoard(false);

    if (boardState.status !== 'ready') return;

    const payload = readDraggedResource(event);

    if (!payload) {
      setDropMessage('Only shared resources from this workspace can be dropped onto the board.');
      return;
    }

    if (payload.relationshipId !== relationshipId) {
      setDropMessage('This resource belongs to a different workspace.');
      return;
    }

    const boardPosition = getApproximateBoardPosition(event);

    try {
      setIsAddingResource(true);
      setDropMessage('Adding to Miro...');

      const response = await fetch('/api/miro/add-resource-to-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationshipId,
          resourceId: payload.resourceId,
          attachment: payload.resourceId
            ? undefined
            : {
                title: payload.title,
                url: payload.url,
                contentType: payload.contentType,
                kind: payload.kind,
                sizeBytes: payload.sizeBytes,
              },
          position: boardPosition,
        }),
      });
      const data = (await response.json()) as AddResourceResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Could not add the resource to Miro.');
      }

      setDropMessage('Added to the board.');
    } catch (dropFailure) {
      setDropMessage(
        dropFailure instanceof Error
          ? dropFailure.message
          : 'Could not add the resource to Miro.'
      );
    } finally {
      setIsAddingResource(false);
      window.setTimeout(() => setDropMessage(null), 4500);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (boardState.status !== 'ready') return;

    if (hasDraggedResource(event)) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      setIsDraggingResourceOverBoard(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingResourceOverBoard(false);
    }
  }

  function getApproximateBoardPosition(event: DragEvent<HTMLDivElement>) {
    const rect = boardAreaRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: Math.round((event.clientX - rect.left - rect.width / 2) * BOARD_COORDINATE_SCALE),
      y: Math.round((event.clientY - rect.top - rect.height / 2) * BOARD_COORDINATE_SCALE),
    };
  }

  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Whiteboard
        </p>

        {boardState.status === 'ready' ? (
          <a
            href={boardState.miroBoardUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Open in Miro
          </a>
        ) : null}
      </div>

      {dropMessage ? (
        <p
          className={cn(
            'mt-4 rounded-2xl px-4 py-3 text-sm',
            dropMessage.includes('Could not') || dropMessage.includes('Only') || dropMessage.includes('different')
              ? 'bg-rose-50 text-rose-700'
              : 'bg-emerald-50 text-emerald-700'
          )}
        >
          {dropMessage}
        </p>
      ) : null}

      <div
        ref={boardAreaRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative mt-5 h-[calc(100vh-320px)] min-h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
            Creating shared Miro board...
          </div>
        ) : null}

        {boardState.status === 'error' ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-rose-600">
            {boardState.message}
          </div>
        ) : null}

        {boardState.status === 'ready' ? (
          <iframe
            title="Lesson Miro whiteboard"
            src={buildMiroEmbedSrc(boardState.miroEmbedUrl)}
            className="h-full w-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        ) : null}

        {isResourceDragActive || isDraggingResourceOverBoard || isAddingResource ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'absolute inset-0 z-20 flex items-center justify-center p-8 backdrop-blur-[2px]',
              isDraggingResourceOverBoard || isAddingResource
                ? 'bg-slate-950/35'
                : 'bg-slate-950/20'
            )}
          >
            <div className="rounded-3xl border border-white/40 bg-white/95 px-6 py-5 text-center shadow-2xl">
              <p className="text-base font-semibold text-slate-950">
                {isAddingResource ? 'Adding to Miro...' : 'Drop to add to the board'}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}



async function requestMiroBoard(relationshipId: string) {
  const existingRequest = ensureBoardRequests.get(relationshipId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch('/api/miro/ensure-board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ relationshipId }),
  })
    .then(async (response) => {
      const data = (await response.json()) as EnsureBoardResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Could not load the Miro whiteboard.');
      }

      return data;
    })
    .finally(() => {
      ensureBoardRequests.delete(relationshipId);
    });

  ensureBoardRequests.set(relationshipId, request);
  return request;
}

function buildMiroEmbedSrc(miroEmbedUrl: string) {
  const url = new URL(miroEmbedUrl);

  url.searchParams.set('autoplay', 'true');

  return url.toString();
}

function hasDraggedResource(event: DragEvent<HTMLDivElement>) {
  return Array.from(event.dataTransfer.types).includes(RESOURCE_DRAG_MIME_TYPE);
}

function readDraggedResource(event: DragEvent<HTMLDivElement>) {
  const rawPayload = event.dataTransfer.getData(RESOURCE_DRAG_MIME_TYPE);

  if (!rawPayload) return null;

  try {
    const payload = JSON.parse(rawPayload) as DraggedResourcePayload;

    if (!payload.relationshipId) return null;
    if (!payload.resourceId && !payload.url) return null;

    return payload;
  } catch {
    return null;
  }
}
