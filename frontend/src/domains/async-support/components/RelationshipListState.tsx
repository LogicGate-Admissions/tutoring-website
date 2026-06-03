'use client';

/**
 * File purpose:
 * Shared loading, error, and empty state for relationship lists.
 */

import { Card } from '@/shared/components/Card';

type RelationshipListStateProps = {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
};

export function RelationshipListState({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
}: RelationshipListStateProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Loading relationships...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-950">{emptyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {emptyDescription}
        </p>
      </Card>
    );
  }

  return null;
}