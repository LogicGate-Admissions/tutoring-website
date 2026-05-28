'use client';

import { useMemo, useState } from 'react';
import ChoiceButton from '../components/onboarding/ChoiceButton';
import StepTabs from '../components/onboarding/StepTabs';
import {
  admissionsTests,
  categories,
  Category,
  otherQualifications,
  subjectOptions,
} from '../lib/onboardingOptions';

type SelectedSubjects = Record<string, string[]>;

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

function getDefaultSubjects(section: string) {
  return subjectOptions[section].slice(0, 2).map((option) => option.value);
}

export default function OnboardingSubjectsPage() {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    'A-level',
    'University admissions',
  ]);

  const [selectedOtherQualifications, setSelectedOtherQualifications] = useState<string[]>([
    'IB',
  ]);

  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubjects>({
    'A-level': ['Maths', 'Physics'],
    GCSE: [],
    IB: ['Maths AA HL', 'Physics HL'],
    IGCSE: [],
    IAL: [],
    'Scottish Highers': [],
  });

  const [selectedAdmissionsTests, setSelectedAdmissionsTests] = useState<string[]>([
    'TMUA',
    'MAT',
  ]);

  const selectedStudySections = useMemo(() => {
    const sections: string[] = [];

    if (selectedCategories.includes('A-level')) {
      sections.push('A-level');
    }

    if (selectedCategories.includes('GCSE')) {
      sections.push('GCSE');
    }

    if (selectedCategories.includes('Other')) {
      sections.push(...selectedOtherQualifications);
    }

    return sections;
  }, [selectedCategories, selectedOtherQualifications]);

  const hasAdmissions = selectedCategories.includes('University admissions');

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories((current) => {
      const next = toggleValue(current, category) as Category[];

      if (next.length === 0) {
        return current;
      }

      return next;
    });

    if (category === 'A-level' && !selectedCategories.includes('A-level')) {
      addDefaultSubjects('A-level');
    }

    if (category === 'GCSE' && !selectedCategories.includes('GCSE')) {
      addDefaultSubjects('GCSE');
    }

    if (category === 'Other' && !selectedCategories.includes('Other')) {
      selectedOtherQualifications.forEach(addDefaultSubjects);
    }

    if (
      category === 'University admissions' &&
      !selectedCategories.includes('University admissions')
    ) {
      setSelectedAdmissionsTests((current) => (current.length > 0 ? current : ['TMUA']));
    }
  };

  const handleOtherQualificationToggle = (qualification: string) => {
    setSelectedOtherQualifications((current) => {
      const next = toggleValue(current, qualification);

      if (next.length === 0) {
        return current;
      }

      return next;
    });

    if (!selectedOtherQualifications.includes(qualification)) {
      addDefaultSubjects(qualification);
    }
  };

  const addDefaultSubjects = (section: string) => {
    setSelectedSubjects((current) => ({
      ...current,
      [section]: current[section]?.length > 0 ? current[section] : getDefaultSubjects(section),
    }));
  };

  const handleSubjectToggle = (section: string, subject: string) => {
    setSelectedSubjects((current) => ({
      ...current,
      [section]: toggleValue(current[section] ?? [], subject),
    }));
  };

  const selectedSubjectTags = selectedStudySections.flatMap((section) =>
    (selectedSubjects[section] ?? []).map((subject) => `${section}: ${subject}`)
  );

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex items-start justify-between gap-6">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            What are you studying for?
          </h1>

          <button
            type="button"
            className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
          >
            Change preferences
          </button>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 text-xl font-bold">Choose one or more categories</h2>

              <div className="flex flex-wrap gap-4">
                {categories.map((category) => (
                  <ChoiceButton
                    key={category}
                    label={category === 'Other' ? 'Other ▾' : category}
                    selected={selectedCategories.includes(category)}
                    onClick={() => handleCategoryToggle(category)}
                  />
                ))}
              </div>

              {selectedCategories.includes('Other') && (
                <div className="mt-5 rounded-[1.5rem] border-2 border-slate-950 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-600">
                    Other qualifications
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {otherQualifications.map((qualification) => (
                      <ChoiceButton
                        key={qualification.value}
                        label={qualification.label}
                        selected={selectedOtherQualifications.includes(qualification.value)}
                        onClick={() => handleOtherQualificationToggle(qualification.value)}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {selectedStudySections.map((section) => (
              <section key={section}>
                <h2 className="mb-4 text-xl font-bold">Subjects for {section}</h2>

                <div className="flex max-w-3xl flex-wrap gap-4">
                  {subjectOptions[section].map((subject) => (
                    <ChoiceButton
                      key={subject.value}
                      label={subject.label}
                      selected={(selectedSubjects[section] ?? []).includes(subject.value)}
                      onClick={() => handleSubjectToggle(section, subject.value)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {hasAdmissions && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Admissions tests</h2>

                <div className="flex max-w-3xl flex-wrap gap-4">
                  {admissionsTests.map((test) => (
                    <ChoiceButton
                      key={test.value}
                      label={test.label}
                      selected={selectedAdmissionsTests.includes(test.value)}
                      onClick={() =>
                        setSelectedAdmissionsTests((current) => toggleValue(current, test.value))
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
            <h2 className="text-xl font-bold">Your selections</h2>

            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="font-semibold text-slate-500">Categories</p>

                <div className="mt-2 flex flex-wrap gap-2">
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

              {selectedCategories.includes('Other') && (
                <div>
                  <p className="font-semibold text-slate-500">Other qualifications</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedOtherQualifications.map((qualification) => (
                      <span
                        key={qualification}
                        className="rounded-lg border-2 border-slate-950 bg-purple-100 px-3 py-1 font-semibold"
                      >
                        {qualification}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-500">Subjects</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSubjectTags.length === 0 && (
                    <span className="text-slate-500">No subjects selected yet</span>
                  )}

                  {selectedSubjectTags.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-lg border-2 border-slate-950 bg-blue-100 px-3 py-1 font-semibold"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {hasAdmissions && (
                <div>
                  <p className="font-semibold text-slate-500">Admissions tests</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAdmissionsTests.length === 0 && (
                      <span className="text-slate-500">No tests selected yet</span>
                    )}

                    {selectedAdmissionsTests.map((test) => (
                      <span
                        key={test}
                        className="rounded-lg border-2 border-slate-950 bg-green-100 px-3 py-1 font-semibold"
                      >
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-14 flex justify-end pb-24">
          <button
            type="button"
            className="rounded-xl border-2 border-emerald-500 bg-white px-10 py-3 text-xl font-medium text-slate-950 transition hover:bg-emerald-50"
          >
            Next →
          </button>
        </div>
      </section>

      <StepTabs />
    </main>
  );
}