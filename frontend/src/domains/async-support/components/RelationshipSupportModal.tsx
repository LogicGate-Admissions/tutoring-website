'use client';

/**
 * File purpose: Dashboard modal for accepted relationship support tools.
 *
 * Keeps message threads and shared resources inside the dashboard instead of
 * navigating users away from the current tab.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageThread } from '@/domains/async-support/components/MessageThread';
import { ResourcesPanel } from '@/domains/async-support/components/ResourcesPanel';
import type { AsyncSupportRole } from '@/domains/async-support/types/asyncSupport';
import { Button } from '@/shared/components/Button';

export type RelationshipSupportModalFeature = 'messages' | 'resources';

type RelationshipSupportModalProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
  feature: RelationshipSupportModalFeature;
  title: string;
  description: string;
  onClose: () => void;
};

export function RelationshipSupportModal({
  relationshipId,
  viewerRole,
  feature,
  title,
  description,
  onClose,
}: RelationshipSupportModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {feature === 'messages' ? 'Messages' : 'Shared resources'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {feature === 'messages' ? (
            <MessageThread
              relationshipId={relationshipId}
              viewerRole={viewerRole}
              density="embedded"
              showHeader={false}
            />
          ) : (
            <ResourcesPanel
              relationshipId={relationshipId}
              viewerRole={viewerRole}
              mode="embedded"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
