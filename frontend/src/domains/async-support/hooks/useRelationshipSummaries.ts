'use client';

/**
 * File purpose:
 * Shared hook for loading the current user's async-support relationships.
 *
 * The hook subscribes to relationship updates in real time. This keeps message
 * activity indicators fresh on the dashboard and in the notification bell when
 * latest-message metadata changes.
 */

import { useEffect, useState } from 'react';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import { subscribeToRelationshipSummaries } from '@/domains/async-support/services/relationshipsService';
import type {
  AsyncSupportRole,
  RelationshipSupportSummary,
} from '@/domains/async-support/types/asyncSupport';

type UseRelationshipSummariesResult = {
  relationships: RelationshipSupportSummary[];
  isLoading: boolean;
  error: string | null;
};

export function useRelationshipSummaries(
  viewerRole: AsyncSupportRole
): UseRelationshipSummariesResult {
  const [relationships, setRelationships] = useState<RelationshipSupportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeRelationships: (() => void) | undefined;

    const unsubscribeAuth = subscribeToCurrentUser((user) => {
      unsubscribeRelationships?.();
      unsubscribeRelationships = undefined;

      if (!user || user.role !== viewerRole) {
        setRelationships([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      unsubscribeRelationships = subscribeToRelationshipSummaries({
        viewerId: user.id,
        viewerRole,
        onChange: (loadedRelationships) => {
          setRelationships(loadedRelationships);
          setIsLoading(false);
          setError(null);
        },
        onError: () => {
          setRelationships([]);
          setIsLoading(false);
          setError('Could not load your support relationships.');
        },
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRelationships?.();
    };
  }, [viewerRole]);

  return {
    relationships,
    isLoading,
    error,
  };
}
