'use client';

/**
 * File purpose: embed the persistent Miro board for a relationship workspace.
 *
 * The component asks a server route to create or reuse the Miro board. The API
 * route owns the Miro token so secrets never enter the browser bundle.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/shared/components/Card';

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
  miroBoardUrl?: string;
  miroEmbedUrl?: string;
  error?: string;
};

export function MiroWhiteboard({ relationshipId }: MiroWhiteboardProps) {
  const [boardState, setBoardState] = useState<MiroBoardState>({
    relationshipId: null,
    status: 'loading',
  });

  useEffect(() => {
    let isActive = true;

    async function ensureBoard() {
      try {
        const response = await fetch('/api/miro/ensure-board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ relationshipId }),
        });
        const data = (await response.json()) as EnsureBoardResponse;

        if (!isActive) return;

        if (!response.ok || !data.miroEmbedUrl || !data.miroBoardUrl) {
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
      } catch {
        if (!isActive) return;

        setBoardState({
          relationshipId,
          status: 'error',
          message: 'Could not connect to the Miro whiteboard service.',
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

  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Whiteboard
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Persistent Miro board
          </h2>
        </div>

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

      <div className="mt-5 h-[calc(100vh-320px)] min-h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
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
            src={boardState.miroEmbedUrl}
            className="h-full w-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        ) : null}
      </div>
    </Card>
  );
}
