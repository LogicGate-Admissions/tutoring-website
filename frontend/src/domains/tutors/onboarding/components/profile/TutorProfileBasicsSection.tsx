/**
 * File purpose: Render the basic public profile fields in tutor onboarding.
 *
 * This component is deliberately presentational. It receives the current draft
 * and change callbacks from TutorOnboardingPage, which keeps saving/auth logic
 * out of small form UI files.
 */

import { Card } from '@/shared/components/Card';
import { UNIVERSITY_OPTIONS } from '@/domains/students/learning-profile/constants/learningProfileOptions';
import type { TutorProfileDraft } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';

type TutorProfileBasicsSectionProps = {
  /** The tutor profile draft currently being edited. */
  profile: TutorProfileDraft;

  /** Updates text fields owned by this section. */
  onChangeTextField: (
    field: 'displayName' | 'headline' | 'university' | 'degree' | 'bio',
    value: string
  ) => void;

};

/**
 * Basic tutor profile section.
 *
 * These fields become visible to students in tutor discovery, so this section
 * focuses on clear public-facing information: name, headline, institution,
 * degree, and bio. Per-subject prices are edited in the Subjects tab.
 */
export function TutorProfileBasicsSection({
  profile,
  onChangeTextField,
}: TutorProfileBasicsSectionProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Profile basics</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        These details help students understand who you are before they open your
        full profile.
      </p>

      <div className="mt-5 grid gap-5">
        <TextField
          id="displayName"
          label="Display name"
          value={profile.displayName}
          placeholder="e.g. Maya Patel"
          onChange={(value) => onChangeTextField('displayName', value)}
        />

        <TextField
          id="headline"
          label="Tutor headline"
          value={profile.headline}
          placeholder="e.g. A-level Maths tutor focused on exam confidence"
          onChange={(value) => onChangeTextField('headline', value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="university"
            label="University"
            value={profile.university}
            placeholder={UNIVERSITY_OPTIONS[0]}
            onChange={(value) => onChangeTextField('university', value)}
          />

          <TextField
            id="degree"
            label="Degree"
            value={profile.degree}
            placeholder="e.g. Mathematics BSc"
            onChange={(value) => onChangeTextField('degree', value)}
          />
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="bio">
          Short bio
          <textarea
            id="bio"
            value={profile.bio}
            rows={5}
            placeholder="Explain how you teach, what exams you know well, and what kind of student you work best with."
            onChange={(event) => onChangeTextField('bio', event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>
    </Card>
  );
}

function TextField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}
