/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { Badge } from '@/shared/components/Badge';
import type { TrialSessionStatus } from '@/domains/sessions/trial-sessions/types/trialSession';

type TrialStatusBadgeProps = {
  status: TrialSessionStatus;
};

/**
 * Visual label for the current state of a trial request.
 */
export function TrialStatusBadge({ status }: TrialStatusBadgeProps) {
  const label = {
    pending: 'Awaiting tutor reply',
    accepted: 'Accepted',
    rejected: 'Rejected',
  }[status];

  const className = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-rose-200 bg-rose-50 text-rose-800',
  }[status];

  return <Badge className={className}>{label}</Badge>;
}
