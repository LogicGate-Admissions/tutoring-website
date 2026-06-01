import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';

type TutorCardProps = {
  tutor: Tutor;
  existingRequest?: TrialSessionRequest;
  onRequestTrial: (tutor: Tutor) => void;
};

/**
 * Shows one tutor result in the student tutor discovery page.
 *
 * The layout is compact enough for a two-column results grid while still
 * keeping the key decision-making information visible at a glance.
 */
export function TutorCard({ tutor, existingRequest, onRequestTrial }: TutorCardProps) {
  const hasExistingRequest = Boolean(existingRequest);

  return (
    <Card className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {tutor.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-700">{tutor.headline}</p>
            <p className="mt-1 text-sm text-slate-500">
              {tutor.degree} · {tutor.university}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold text-slate-950">£{tutor.pricePerHour}</p>
            <p className="text-xs text-slate-500">per hour</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{tutor.rating.toFixed(1)} rating</Badge>
          <Badge>{tutor.reviews} reviews</Badge>
          {tutor.subjects.slice(0, 3).map((subject) => (
            <Badge key={subject}>{subject}</Badge>
          ))}
          {tutor.learningStyles.slice(0, 2).map((style) => (
            <Badge key={style}>{style}</Badge>
          ))}
        </div>

        <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
          {tutor.bio}
        </p>

        <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-900">Availability:</span>{' '}
            {tutor.availability}
          </p>
          <p>
            <span className="font-medium text-slate-900">Students:</span>{' '}
            {tutor.numberOfStudents}
          </p>
          <p>
            <span className="font-medium text-slate-900">Personality:</span>{' '}
            {tutor.personality.join(', ')}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        {existingRequest && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Trial request</p>
            <TrialStatusBadge status={existingRequest.status} />
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="w-full"
            disabled={hasExistingRequest}
            onClick={() => onRequestTrial(tutor)}
          >
            {hasExistingRequest ? 'Request sent' : 'Book trial'}
          </Button>

          <Button variant="secondary" className="w-full">
            View profile
          </Button>
        </div>
      </div>
    </Card>
  );
}
