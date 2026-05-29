'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ChoiceButton from '../../components/onboarding/ChoiceButton';
import InfoChoiceButton from '../../components/onboarding/InfoChoiceButton';
import StepTabs from '../../components/onboarding/StepTabs';
import { learningStyles, universities } from '../../lib/preferenceOptions';

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

//

export default function PreferencesOnboardingPage() {
  const [selectedLearningStyles, setSelectedLearningStyles] = useState<string[]>([]);

  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([
    'imperial-college-london',
    'university-of-cambridge',
  ]);

  const [universitySearch, setUniversitySearch] = useState('');
  const [noUniversityPreference, setNoUniversityPreference] = useState(false);
  const [hoveredInfoValue, setHoveredInfoValue] = useState<string | null>(null);

  const hoveredInfo = learningStyles.find((style) => style.value === hoveredInfoValue);

  const filteredUniversities = useMemo(() => {
    const search = universitySearch.trim().toLowerCase();

    if (!search) {
      return universities;
    }

    return universities.filter((university) =>
      university.label.toLowerCase().includes(search)
    );
  }, [universitySearch]);

  const selectedUniversityLabels = selectedUniversities.map(
    (selectedValue) =>
      universities.find((university) => university.value === selectedValue)?.label ??
      selectedValue
  );

  const selectedLearningStyleLabels = selectedLearningStyles.map(
    (selectedValue) =>
      learningStyles.find((style) => style.value === selectedValue)?.label ?? selectedValue
  );

  const handleLearningStyleToggle = (styleValue: string) => {
    setSelectedLearningStyles((current) => toggleValue(current, styleValue));
  };

  const handleUniversityToggle = (universityValue: string) => {
    setNoUniversityPreference(false);
    setSelectedUniversities((current) => toggleValue(current, universityValue));
  };

  const handleNoPreference = () => {
    setNoUniversityPreference(true);
    setSelectedUniversities([]);
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex items-start justify-between gap-6">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            How do you like to learn?
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
              <h2 className="mb-4 text-xl font-bold">Learning style</h2>

              <div className="grid max-w-3xl gap-4">
                {learningStyles.map((style) => (
                  <InfoChoiceButton
                    key={style.value}
                    label={style.label}
                    selected={selectedLearningStyles.includes(style.value)}
                    onClick={() => handleLearningStyleToggle(style.value)}
                    onInfoEnter={() => setHoveredInfoValue(style.value)}
                    onInfoLeave={() => setHoveredInfoValue(null)}
                  />
                ))}
              </div>

              {hoveredInfo && (
                <div className="mt-5 max-w-3xl rounded-[1.5rem] border-2 border-slate-950 bg-cyan-50 p-5 shadow-[4px_4px_0_#0f172a]">
                  <p className="text-sm font-bold text-slate-500">Learning style meaning</p>
                  <h3 className="mt-2 text-xl font-bold">{hoveredInfo.label}</h3>
                  <p className="mt-2 text-base font-medium text-slate-700">
                    {hoveredInfo.description}
                  </p>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold">University preference</h2>

              <div className="max-w-3xl rounded-[1.75rem] border-2 border-slate-950 bg-slate-50 p-5 shadow-[6px_6px_0_#0f172a]">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-600">
                    Search universities
                  </span>

                  <div className="flex items-center gap-3 rounded-xl border-2 border-slate-950 bg-white px-4 py-3">
                    <span className="text-xl font-bold">⌕</span>
                    <input
                      value={universitySearch}
                      onChange={(event) => setUniversitySearch(event.target.value)}
                      placeholder="Search universities..."
                      className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <div className="mt-5 grid max-h-72 gap-3 overflow-auto pr-2">
                  {filteredUniversities.map((university) => (
                    <ChoiceButton
                      key={university.value}
                      label={university.label}
                      selected={selectedUniversities.includes(university.value)}
                      onClick={() => handleUniversityToggle(university.value)}
                      className="w-full text-left"
                    />
                  ))}

                  {filteredUniversities.length === 0 && (
                    <p className="rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold text-slate-500">
                      No universities found.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <ChoiceButton
                    label="No preference"
                    selected={noUniversityPreference}
                    onClick={handleNoPreference}
                    className="text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setUniversitySearch('')}
                    className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
                  >
                    Add another +
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
            <h2 className="text-xl font-bold">Your preferences</h2>

            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="font-semibold text-slate-500">Learning styles</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedLearningStyleLabels.length === 0 && (
                    <span className="rounded-lg border-2 border-slate-950 bg-white px-3 py-1 font-semibold">
                      Any learning style
                    </span>
                  )}

                  {selectedLearningStyleLabels.map((style) => (
                    <span
                      key={style}
                      className="rounded-lg border-2 border-slate-950 bg-cyan-100 px-3 py-1 font-semibold"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Universities</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {noUniversityPreference && (
                    <span className="rounded-lg border-2 border-slate-950 bg-white px-3 py-1 font-semibold">
                      No preference
                    </span>
                  )}

                  {!noUniversityPreference && selectedUniversityLabels.length === 0 && (
                    <span className="text-slate-500">No universities selected yet</span>
                  )}

                  {selectedUniversityLabels.map((university) => (
                    <span
                      key={university}
                      className="rounded-lg border-2 border-slate-950 bg-purple-100 px-3 py-1 font-semibold"
                    >
                      {university}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                <p className="font-bold">Matching summary</p>
                <p className="mt-2 text-slate-600">
                  Tutors will be ranked using your selected learning styles and university
                  preferences, alongside the subject and availability choices from onboarding.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-4 z-30 mt-14 flex justify-between pb-4">
          <Link
            href="/time"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium shadow-[4px_4px_0_#0f172a] transition hover:bg-slate-50"
          >
            ← Back
          </Link>

          <Link
            href="/tutors"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium shadow-[4px_4px_0_#0f172a] transition hover:bg-slate-50"
          >
            See tutors →
          </Link>
        </div>
      </section>

      <StepTabs activeStep="preferences" />
    </main>
  );
}