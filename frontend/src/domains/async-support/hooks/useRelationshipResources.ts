'use client';

/** File purpose: realtime hook for relationship resources. */

import { useEffect, useState } from 'react';
import type { SharedResource } from '@/domains/async-support/types/asyncSupport';
import { subscribeToRelationshipResources } from '@/domains/async-support/services/resourcesService';

type ResourcesState = {
  relationshipId: string | null;
  resources: SharedResource[];
  error: string | null;
};

export function useRelationshipResources(relationshipId: string) {
  const [state, setState] = useState<ResourcesState>({
    relationshipId: null,
    resources: [],
    error: null,
  });

  useEffect(() => {
    if (!relationshipId) return undefined;

    return subscribeToRelationshipResources({
      relationshipId,
      onChange: (nextResources) => {
        setState({
          relationshipId,
          resources: nextResources,
          error: null,
        });
      },
      onError: () => {
        setState({
          relationshipId,
          resources: [],
          error: 'Could not load resources.',
        });
      },
    });
  }, [relationshipId]);

  const isCurrentRelationship = state.relationshipId === relationshipId;

  return {
    resources: isCurrentRelationship ? state.resources : [],
    loading: !isCurrentRelationship && !state.error,
    error: isCurrentRelationship ? state.error : null,
  };
}
