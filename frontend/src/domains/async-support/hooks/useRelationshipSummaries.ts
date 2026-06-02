'use client';

/**
 * File purpose:
 * Shared hook for loading the current user's async-support relationships.
 *
 * Both student and tutor dashboard variants use this hook so the A/B test only
 * changes navigation, not the underlying data source.
 */

import { useEffect, useState } from 'react';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import {
  getStudentRelationships,
  getTutorRelationships,
} from '@/domains/async-support/services/relationshipsService';
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
    let isActive = true;

    const unsubscribe = subscribeToCurrentUser(async (user) => {
      if (!isActive) {
        return;
      }

      if (!user || user.role !== viewerRole) {
        setRelationships([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const loadedRelationships =
          viewerRole === 'tutor'
            ? await getTutorRelationships(user.id)
            : await getStudentRelationships(user.id);

        if (!isActive) {
          return;
        }

        setRelationships(loadedRelationships);
      } catch (caughtError) {
        if (!isActive) {
          return;
        }

        console.error(caughtError);
        setRelationships([]);
        setError('Could not load your support relationships.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [viewerRole]);

  return {
    relationships,
    isLoading,
    error,
  };
}