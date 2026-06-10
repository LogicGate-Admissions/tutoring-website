'use client';

import type {
  QualificationSubjectSelection,
  StudentLearningProfile,
  TimeBlock,
} from '@/domains/students/learning-profile/types/learningProfile';
import { Button } from '@/shared/components/Button';

export function StudentProfileModal({
  studentName,
  profile,
  onClose,
}: {
  studentName: string;
  profile: StudentLearningProfile;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close student profile"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Student profile
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {studentName || 'Student'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Learning context, tutoring needs, preferences, and availability.
            </p>
          </div>

          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProfileSection title="Tutoring needs">
            <SelectionList selections={profile.subjectSelections} />
          </ProfileSection>

          <ProfileSection title="Studied subjects">
            <SelectionList selections={profile.studiedSubjectSelections} />
          </ProfileSection>

          <ProfileSection title="Learning styles">
            {profile.learningStyles.length > 0 ? (
              <TagList values={profile.learningStyles} />
            ) : (
              <EmptyText>No learning styles saved yet.</EmptyText>
            )}
          </ProfileSection>

          <ProfileSection title="Preferred universities">
            {profile.preferredUniversities.length > 0 ? (
              <TagList values={profile.preferredUniversities} />
            ) : (
              <EmptyText>No university preferences saved yet.</EmptyText>
            )}
          </ProfileSection>

          <div className="md:col-span-2">
            <ProfileSection title="Availability">
              <AvailabilityList blocks={profile.availability} />
            </ProfileSection>
          </div>
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
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selection.category}
          </p>
          <TagList values={selection.subjects} />
        </div>
      ))}
    </div>
  );
}

function TagList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function AvailabilityList({ blocks }: { blocks: TimeBlock[] }) {
  if (blocks.length === 0) {
    return <EmptyText>No availability saved yet.</EmptyText>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {blocks.map((block) => (
        <span
          key={block.id}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {block.day} {block.from}-{block.to}
        </span>
      ))}
    </div>
  );
}

function EmptyText({ children }: { children: string }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}
