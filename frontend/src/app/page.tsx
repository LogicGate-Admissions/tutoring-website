'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ChoiceButton from '../components/onboarding/ChoiceButton';
import StepTabs from '../components/onboarding/StepTabs';
import {
  admissionsTests,
  categories,
  moreSubjectOptions,
  otherQualifications,
  subjectOptions,
} from '../lib/onboardingOptions';

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

function MoreSubjectPicker({
  title,
  options,
  selectedSubjects,
  onToggle,
}: {
  title: string;
  options: string[];
  selectedSubjects: string[];
  onToggle: (subject: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
      >
        More {title} options
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-30 w-80 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#0f172a]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-bold">More {title}</p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border-2 border-slate-950 px-2 text-sm font-black hover:bg-slate-50"
            >
              ×
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="mb-3 w-full rounded-xl border-2 border-slate-950 px-3 py-2 text-sm font-semibold outline-none"
          />

          <div className="max-h-56 space-y-2 overflow-auto">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`block w-full rounded-xl border-2 border-slate-950 px-3 py-2 text-left text-sm font-bold transition ${
                  selectedSubjects.includes(option)
                    ? 'bg-cyan-100'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {option} {selectedSubjects.includes(option) && '✓'}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <p className="rounded-xl border-2 border-slate-950 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                No matches found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubjectsOnboardingPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'A-level',
    'University admissions',
  ]);

  const [selectedOtherQualifications, setSelectedOtherQualifications] = useState<string[]>([]);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'Maths',
    'Further Maths',
    'Physics',
  ]);

  const [selectedAdmissionsTests, setSelectedAdmissionsTests] = useState<string[]>([
    'TMUA',
    'MAT',
  ]);

  const visibleSubjectSections = useMemo(() => {
    return selectedCategories.filter(
      (category) => category !== 'University admissions' && category !== 'Other'
    );
  }, [selectedCategories]);

  const selectedSummary = [
    ...selectedCategories,
    ...selectedOtherQualifications,
    ...selectedSubjects,
    ...selectedAdmissionsTests,
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((current) => toggleValue(current, category));
  };

  const handleOtherQualificationToggle = (qualification: string) => {
    setSelectedOtherQualifications((current) => toggleValue(current, qualification));
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((current) => toggleValue(current, subject));
  };

  const handleAdmissionsTestToggle = (test: string) => {
    setSelectedAdmissionsTests((current) => toggleValue(current, test));
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Student View
            </p>

            <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              What do you need help with?
            </h1>
          </div>

          <Link
            href="/tutor-dashboard"
            className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200"
          >
            Tutor View
          </Link>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 text-xl font-bold">Level or qualification</h2>

              <div className="flex flex-wrap gap-4">
                {categories.map((category) => (
                  <ChoiceButton
                    key={category}
                    label={category}
                    selected={selectedCategories.includes(category)}
                    onClick={() => handleCategoryToggle(category)}
                  />
                ))}
              </div>

              {selectedCategories.includes('Other') && (
                <div className="mt-5 rounded-[1.75rem] border-2 border-slate-950 bg-slate-50 p-5 shadow-[6px_6px_0_#0f172a]">
                  <h3 className="text-lg font-bold">Other qualifications</h3>

                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Choose one if it applies, or leave this blank and just select subjects below.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {otherQualifications.map((qualification) => (
                      <ChoiceButton
                        key={qualification}
                        label={qualification}
                        selected={selectedOtherQualifications.includes(qualification)}
                        onClick={() => handleOtherQualificationToggle(qualification)}
                      />
                    ))}
                  </div>

                  <div className="mt-5">
                    <MoreSubjectPicker
                      title="Other"
                      options={moreSubjectOptions.Other ?? []}
                      selectedSubjects={selectedSubjects}
                      onToggle={handleSubjectToggle}
                    />
                  </div>
                </div>
              )}
            </section>

            {visibleSubjectSections.map((category) => (
              <section key={category}>
                <h2 className="mb-4 text-xl font-bold">{category} subjects</h2>

                <div className="flex flex-wrap gap-4">
                  {(subjectOptions[category] ?? []).map((subject) => (
                    <ChoiceButton
                      key={subject}
                      label={subject}
                      selected={selectedSubjects.includes(subject)}
                      onClick={() => handleSubjectToggle(subject)}
                    />
                  ))}
                </div>

                <div className="mt-5">
                  <MoreSubjectPicker
                    title={category}
                    options={moreSubjectOptions[category] ?? []}
                    selectedSubjects={selectedSubjects}
                    onToggle={handleSubjectToggle}
                  />
                </div>
              </section>
            ))}

            {selectedCategories.includes('University admissions') && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Admissions tests</h2>

                <div className="flex flex-wrap gap-4">
                  {admissionsTests.map((test) => (
                    <ChoiceButton
                      key={test}
                      label={test}
                      selected={selectedAdmissionsTests.includes(test)}
                      onClick={() => handleAdmissionsTestToggle(test)}
                    />
                  ))}
                </div>

                <div className="mt-5">
                  <MoreSubjectPicker
                    title="admissions"
                    options={moreSubjectOptions['University admissions'] ?? []}
                    selectedSubjects={selectedAdmissionsTests}
                    onToggle={handleAdmissionsTestToggle}
                  />
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
            <h2 className="text-xl font-bold">Your selections</h2>

            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="font-semibold text-slate-500">Level</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCategories.length === 0 && (
                    <span className="text-slate-500">No level selected yet</span>
                  )}

                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-lg border-2 border-slate-950 bg-cyan-100 px-3 py-1 font-semibold"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Other qualifications</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOtherQualifications.length === 0 && (
                    <span className="text-slate-500">None selected</span>
                  )}

                  {selectedOtherQualifications.map((qualification) => (
                    <span
                      key={qualification}
                      className="rounded-lg border-2 border-slate-950 bg-white px-3 py-1 font-semibold"
                    >
                      {qualification}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Subjects</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSubjects.length === 0 && (
                    <span className="text-slate-500">No subjects selected yet</span>
                  )}

                  {selectedSubjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-lg border-2 border-slate-950 bg-green-100 px-3 py-1 font-semibold"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Admissions tests</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAdmissionsTests.length === 0 && (
                    <span className="text-slate-500">None selected</span>
                  )}

                  {selectedAdmissionsTests.map((test) => (
                    <span
                      key={test}
                      className="rounded-lg border-2 border-slate-950 bg-purple-100 px-3 py-1 font-semibold"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                <p className="font-bold">Matching summary</p>

                <p className="mt-2 text-slate-600">
                  {selectedSummary.length === 0
                    ? 'No filters selected yet. Tutors will not be narrowed down by subject.'
                    : 'Tutors will be matched using these subject and level choices.'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 flex justify-end pb-24">
          <Link
            href="/time"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium transition hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>
      </section>

      <StepTabs activeStep="subjects" />
    </main>
  );
}