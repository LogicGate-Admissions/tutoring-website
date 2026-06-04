/**
 * File purpose: Application source file. Comments explain what this file owns and what should stay elsewhere.
 */

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { HomeLinkButton } from '@/shared/components/HomeLinkButton';
import { TrialStatusBadge } from '@/domains/sessions/trial-sessions/components/TrialStatusBadge';
import type { TrialSessionRequest } from '@/domains/sessions/trial-sessions/types/trialSession';
import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import { tutorInitials } from '@/domains/tutors/tutor-discovery/utils/tutorDisplay';

type TutorProfileModalProps = {
  tutor: Tutor;
  existingRequest?: TrialSessionRequest;
  isShortlisted: boolean;
  onClose: () => void;
  onChat: (tutor: Tutor) => void;
  onToggleShortlist: (tutor: Tutor) => void;
  onRequestTrial: (tutor: Tutor) => void;
};

/**
 * Full tutor profile shown as an overlay.
 *
 * The modal is intentionally separate from the results grid so opening a
 * profile does not squeeze or reflow the tutor cards underneath.
 */
export function TutorProfileModal({
  tutor,
  existingRequest,
  isShortlisted,
  onClose,
  onChat,
  onToggleShortlist,
  onRequestTrial,
}: TutorProfileModalProps) {
  const hasExistingRequest = Boolean(existingRequest);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        {/* Phase 1: identify who this tutor is before showing detailed stats. */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-semibold text-white">
              {tutorInitials(tutor.name)}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Tutor profile
              </p>

              <h3 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                {tutor.name}
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-700">
                {tutor.university}
              </p>

              <p className="mt-1 text-sm text-slate-500">{tutor.degree}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <HomeLinkButton label="Home" />

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Phase 2: show decision-making stats as separate blocks. */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ProfileStat label="from per hour" value={`£${tutor.pricePerHour}`} />
          <ProfileStat
            label={`${tutor.reviews} reviews`}
            value={`★ ${tutor.rating.toFixed(1)}`}
          />
          <ProfileStat
            label="students taught"
            value={String(tutor.numberOfStudents)}
          />
        </div>

        {/* Phase 3: detailed tutor information, kept out of the result cards. */}
        <div className="mt-6 grid gap-6">
          <ProfileSection title="About">
            <p className="text-sm leading-6 text-slate-700">{tutor.bio}</p>
          </ProfileSection>


          {tutor.subjectRates && tutor.subjectRates.length > 0 && (
            <ProfileSection title="Subject rates">
              <div className="grid gap-2">
                {tutor.subjectRates.map((rate) => (
                  <div
                    key={`${rate.qualification}-${rate.subject}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {rate.qualification} · {rate.subject}
                    </span>
                    <span className="font-semibold text-slate-950">
                      £{rate.pricePerHour}/hr
                    </span>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileSection title="Levels taught">
              <BadgeList values={tutor.levels} />
            </ProfileSection>

            <ProfileSection title="Subjects">
              <BadgeList values={tutor.subjects} />
            </ProfileSection>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileSection title="Learning styles">
              <p className="text-sm leading-6 text-slate-700">
                {tutor.learningStyles.join(', ')}
              </p>
            </ProfileSection>

            <ProfileSection title="Availability">
              <p className="text-sm leading-6 text-slate-700">
                {tutor.availability}
              </p>
            </ProfileSection>
          </div>

          <ProfileSection title="Personality">
            <p className="text-sm leading-6 text-slate-700">
              {tutor.personality.join(', ')}
            </p>
          </ProfileSection>
        </div>

        {/* Phase 4: actions live here, not on the compact tutor card. */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          {existingRequest && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Match request
              </p>
              <TrialStatusBadge status={existingRequest.status} />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="secondary" onClick={() => onChat(tutor)}>
              Chat
            </Button>

            <Button variant="secondary" onClick={() => onToggleShortlist(tutor)}>
              {isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </Button>

            <Button disabled={hasExistingRequest} onClick={() => onRequestTrial(tutor)}>
              {hasExistingRequest ? 'Request sent' : 'Request match'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BadgeList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} className="border-slate-300 bg-white text-slate-800">
          {value}
        </Badge>
      ))}
    </div>
  );
}
