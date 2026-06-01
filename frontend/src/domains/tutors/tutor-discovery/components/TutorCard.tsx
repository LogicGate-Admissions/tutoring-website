import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';

type TutorCardProps = {
  tutor: Tutor;
  existingRequest?: TrialSessionRequest;
  onViewProfile: (tutor: Tutor) => void;
};

function tutorInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Compact tutor result card.
 *
 * This only shows the information students need to decide whether to open
 * the full profile. Detailed info and booking live inside the profile modal.
 */
export function TutorCard({
  tutor,
  existingRequest,
  onViewProfile,
}: TutorCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between p-5">
      <div>
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

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-lg font-semibold text-slate-950">
              ★ {tutor.rating.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {tutor.reviews} reviews
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-lg font-semibold text-slate-950">
              £{tutor.pricePerHour}
            </p>
            <p className="mt-1 text-xs text-slate-500">per hour</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Levels taught
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {tutor.levels.map((level) => (
                <Badge
                  key={level}
                  className="border-slate-300 bg-white text-slate-800"
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Subjects
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {tutor.subjects.slice(0, 5).map((subject) => (
                <Badge
                  key={subject}
                  className="border-slate-300 bg-white text-slate-800"
                >
                  {subject}
                </Badge>
              ))}

              {tutor.subjects.length > 5 && (
                <Badge className="border-slate-300 bg-white text-slate-800">
                  +{tutor.subjects.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        {existingRequest && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Trial request</p>
            <TrialStatusBadge status={existingRequest.status} />
          </div>
        )}

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