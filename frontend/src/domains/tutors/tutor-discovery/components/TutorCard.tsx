/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import { hasRequestedMatch } from '@/domains/sessions/trial-sessions/utils/trialRequestState';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import { tutorInitials } from '@/domains/tutors/tutor-discovery/utils/tutorDisplay';

type TutorCardProps = {
  tutor: Tutor;
  existingRequest?: TrialSessionRequest;
  onViewProfile: (tutor: Tutor) => void;
};

/**
 * Compact tutor result card.
 *
 * Cards are kept deliberately scannable: detailed biography, availability,
 * shortlist, chat, and booking actions live in TutorProfileModal.
 */
export function TutorCard({
  tutor,
  existingRequest,
  onViewProfile,
}: TutorCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between p-5">
      <div>
        {/* Phase 1: identify the tutor with avatar, name, and institution. */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
            {tutorInitials(tutor.name)}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {tutor.name}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {tutor.university}
            </p>

            <p className="mt-1 text-sm text-slate-500">{tutor.degree}</p>
          </div>
        </div>

        {/* Phase 2: separate trust and price instead of mixing them with tags. */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <CardMetric
            label={`${tutor.reviews} reviews`}
            value={`★ ${tutor.rating.toFixed(1)}`}
          />
          <CardMetric label="from per hour" value={`£${tutor.pricePerHour}`} />
        </div>

        {/* Phase 3: show teachable scope in clearly labelled groups. */}
        <div className="mt-5 grid gap-4">
          <TutorTagGroup title="Levels taught" values={tutor.levels} />
          <TutorTagGroup
            title="Subjects"
            values={tutor.subjects.slice(0, 5)}
            overflowCount={Math.max(tutor.subjects.length - 5, 0)}
          />
        </div>
      </div>

      {/* Phase 4: keep the card action simple; booking happens in profile. */}
      <div className="mt-5 border-t border-slate-200 pt-4">
        {existingRequest && hasRequestedMatch(existingRequest) ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Match request</p>
            <TrialStatusBadge status={existingRequest.status} />
          </div>
        ) : null}

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onViewProfile(tutor)}
        >
          View profile
        </Button>
      </div>
    </Card>
  );
}

function CardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function TutorTagGroup({
  title,
  values,
  overflowCount = 0,
}: {
  title: string;
  values: string[];
  overflowCount?: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} className="border-slate-300 bg-white text-slate-800">
            {value}
          </Badge>
        ))}

        {overflowCount > 0 && (
          <Badge className="border-slate-300 bg-white text-slate-800">
            +{overflowCount} more
          </Badge>
        )}
      </div>
    </div>
  );
}
