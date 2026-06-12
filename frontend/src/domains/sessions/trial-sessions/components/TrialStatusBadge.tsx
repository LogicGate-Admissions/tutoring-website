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
    pending: 'logicgate-status-pending font-semibold',
    accepted: 'logicgate-status-success font-semibold',
    rejected: 'logicgate-status-danger font-semibold',
  }[status];

  return <Badge className={className}>{label}</Badge>;
}
