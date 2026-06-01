'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ChoiceButton from '../../components/onboarding/ChoiceButton';
import StepTabs from '../../components/onboarding/StepTabs';
import {
  admissionsTests,
  categories,
  moreSubjectOptions,
  otherQualifications,
  subjectOptions,
} from '../../lib/onboardingOptions';

type SelectedSubjectsByLevel = Record<string, string[]>;

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

function SearchableDropdown({
  title,
  buttonLabel,
  options,
  selectedValues,
  onToggle,
}: {
  title: string;
  buttonLabel: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
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
        {buttonLabel}
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-30 w-80 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#0f172a]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-bold">{title}</p>

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
                  selectedValues.includes(option)
                    ? 'bg-cyan-100'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {option} {selectedValues.includes(option) && '✓'}
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

  const [selectedSubjectsByLevel, setSelectedSubjectsByLevel] =
    useState<SelectedSubjectsByLevel>({
      'A-level': ['Maths', 'Further Maths', 'Physics'],
    });

  const [selectedAdmissionsTests, setSelectedAdmissionsTests] = useState<string[]>([
    'TMUA',
    'MAT',
  ]);

  const visibleSubjectSections = useMemo(() => {
    const normalCategories = selectedCategories.filter(
      (category) => category !== 'University admissions' && category !== 'Other'
    );

    return [...normalCategories, ...selectedOtherQualifications];
  }, [selectedCategories, selectedOtherQualifications]);

  const selectedLevelSummary = [
    ...selectedCategories.filter((category) => category !== 'Other'),
    ...selectedOtherQualifications,
  ];

  const selectedSubjectSummary = visibleSubjectSections.flatMap((level) =>
    (selectedSubjectsByLevel[level] ?? []).map((subject) => `${level}: ${subject}`)
  );

  const selectedSummary = [
    ...selectedLevelSummary,
    ...selectedSubjectSummary,
    ...selectedAdmissionsTests,
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((current) => toggleValue(current, category));

    if (category === 'Other' && selectedCategories.includes('Other')) {
      setSelectedOtherQualifications([]);
    }
  };

  const handleOtherQualificationToggle = (qualification: string) => {
    setSelectedOtherQualifications((current) => toggleValue(current, qualification));
  };

  const handleSubjectToggle = (level: string, subject: string) => {
    setSelectedSubjectsByLevel((current) => ({
      ...current,
      [level]: toggleValue(current[level] ?? [], subject),
    }));
  };

  const handleAdmissionsTestToggle = (test: string) => {
    setSelectedAdmissionsTests((current) => toggleValue(current, test));
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex items-start justify-between gap-6">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            What do you need help with?
          </h1>

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
                  <h3 className="text-lg font-bold">Other</h3>

                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Select another qualification, then choose subjects for that qualification below.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedOtherQualifications.map((qualification) => (
                      <ChoiceButton
                        key={qualification}
                        label={qualification}
                        selected
                        onClick={() => handleOtherQualificationToggle(qualification)}
                      />
                    ))}

                    <SearchableDropdown
                      title="Choose qualification"
                      buttonLabel="Choose qualification +"
                      options={otherQualifications.filter(
                        (qualification) => !selectedOtherQualifications.includes(qualification)
                      )}
                      selectedValues={selectedOtherQualifications}
                      onToggle={handleOtherQualificationToggle}
                    />
                  </div>
                </div>
              )}
            </section>

            {visibleSubjectSections.map((level) => {
              const visibleOptions = subjectOptions[level] ?? [];
              const selectedForLevel = selectedSubjectsByLevel[level] ?? [];

              const selectedMoreOptions = selectedForLevel.filter(
                (subject) => !visibleOptions.includes(subject)
              );

              const moreOptions = (moreSubjectOptions[level] ?? []).filter(
                (option) =>
                  !visibleOptions.includes(option) && !selectedForLevel.includes(option)
              );

              return (
                <section key={level}>
                  <h2 className="mb-4 text-xl font-bold">{level} subjects</h2>

                  <div className="flex flex-wrap gap-4">
                    {visibleOptions.map((subject) => (
                      <ChoiceButton
                        key={subject}
                        label={subject}
                        selected={selectedForLevel.includes(subject)}
                        onClick={() => handleSubjectToggle(level, subject)}
                      />
                    ))}

                    {selectedMoreOptions.map((subject) => (
                      <ChoiceButton
                        key={subject}
                        label={subject}
                        selected
                        onClick={() => handleSubjectToggle(level, subject)}
                      />
                    ))}

                    {moreOptions.length > 0 && (
                      <SearchableDropdown
                        title={`More ${level} subjects`}
                        buttonLabel="More subjects +"
                        options={moreOptions}
                        selectedValues={selectedForLevel}
                        onToggle={(subject) => handleSubjectToggle(level, subject)}
                      />
                    )}
                  </div>
                </section>
              );
            })}

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

                  {selectedAdmissionsTests
                    .filter((test) => !admissionsTests.includes(test))
                    .map((test) => (
                      <ChoiceButton
                        key={test}
                        label={test}
                        selected
                        onClick={() => handleAdmissionsTestToggle(test)}
                      />
                    ))}

                  <SearchableDropdown
                    title="More admissions options"
                    buttonLabel="More admissions options +"
                    options={(moreSubjectOptions['University admissions'] ?? []).filter(
                      (option) =>
                        !admissionsTests.includes(option) &&
                        !selectedAdmissionsTests.includes(option)
                    )}
                    selectedValues={selectedAdmissionsTests}
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
                  {selectedLevelSummary.length === 0 && (
                    <span className="text-slate-500">No level selected yet</span>
                  )}

                  {selectedLevelSummary.map((level) => (
                    <span
                      key={level}
                      className="rounded-lg border-2 border-slate-950 bg-cyan-100 px-3 py-1 font-semibold"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Subjects</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSubjectSummary.length === 0 && (
                    <span className="text-slate-500">No subjects selected yet</span>
                  )}

                  {selectedSubjectSummary.map((subject) => (
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

        <div className="sticky bottom-4 z-30 mt-14 flex justify-end pb-4">
          <Link
            href="/time"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium shadow-[4px_4px_0_#0f172a] transition hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>
      </section>

      <StepTabs activeStep="subjects" />
    </main>
  );
}
