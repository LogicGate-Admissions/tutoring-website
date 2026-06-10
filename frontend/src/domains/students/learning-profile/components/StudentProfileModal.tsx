'use client';

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { TutorAvailabilityDisplay } from '@/domains/tutors/tutor-discovery/components/TutorAvailabilityDisplay';
import type {
  QualificationSubjectSelection,
  StudentLearningProfile,
} from '@/domains/students/learning-profile/types/learningProfile';

type StudentProfileModalProps = {
  studentName: string;
  profile: StudentLearningProfile;
  onClose: () => void;
};

export function StudentProfileModal({
  studentName,
  profile,
  onClose,
}: StudentProfileModalProps) {
  const availabilitySummary = profile.availability.length > 0
    ? 'Student availability shown below.'
    : 'Availability not added yet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-semibold text-white">
              {studentInitials(studentName)}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Student profile
              </p>

              <h3 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                {studentName || 'Student'}
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-700">
                Learning context and tutoring preferences
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Use this to prepare explanations, resources, and lesson pacing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6">
          <ProfileSection title="About">
            {profile.bio.trim() ? (
              <p className="text-sm leading-6 text-slate-700">{profile.bio}</p>
            ) : (
              <EmptyText>No learning note added yet.</EmptyText>
            )}
          </ProfileSection>

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileSection title="Tutoring needs">
              <SelectionList selections={profile.subjectSelections} />
            </ProfileSection>

            <ProfileSection title="Studied subjects">
              <SelectionList selections={profile.studiedSubjectSelections} />
            </ProfileSection>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileSection title="Learning styles">
              {profile.learningStyles.length > 0 ? (
                <BadgeList values={profile.learningStyles} />
              ) : (
                <EmptyText>No learning styles saved yet.</EmptyText>
              )}
            </ProfileSection>

            <ProfileSection title="Preferred universities">
              {profile.preferredUniversities.length > 0 ? (
                <BadgeList values={profile.preferredUniversities} />
              ) : (
                <EmptyText>No university preferences saved yet.</EmptyText>
              )}
            </ProfileSection>
          </div>

          <ProfileSection title="Availability">
            <TutorAvailabilityDisplay
              availabilityBlocks={profile.availability}
              fallbackText={availabilitySummary}
            />
          </ProfileSection>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close profile
          </Button>
        </div>
      </div>
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

function SelectionList({
  selections,
}: {
  selections: QualificationSubjectSelection[];
}) {
  const visibleSelections = selections.filter(
    (selection) => selection.subjects.length > 0,
  );

  if (visibleSelections.length === 0) {
    return <EmptyText>No subjects saved yet.</EmptyText>;
  }

  return (
    <div className="grid gap-3">
      {visibleSelections.map((selection) => (
        <div key={selection.category}>
          <p className="mb-2 text-xs font-semibold text-slate-500">
            {selection.category}
          </p>
          <BadgeList values={selection.subjects} />
        </div>
      ))}
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

function EmptyText({ children }: { children: string }) {
  return <p className="text-sm leading-6 text-slate-700">{children}</p>;
}

function studentInitials(name: string) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'S';
}
