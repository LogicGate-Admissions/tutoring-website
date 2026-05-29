'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import TutorCard from '../../components/tutors/TutorCard';
import TutorFilters from '../../components/tutors/TutorFilters';
import { createTrialRequest } from '../../lib/trialRequests';
import { sortOptions, tutors } from '../../lib/tutorOptions';
import type { Tutor } from '../../lib/tutorOptions';

const onboardingSubjects = ['Maths', 'Physics', 'Further Maths', 'TMUA', 'MAT'];
const onboardingLevels = ['A-level', 'University admissions'];
const onboardingLearningStyles = ['Visual explanations', 'Past-paper drilling'];
const onboardingUniversities = ['Imperial College London', 'University of Cambridge'];

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

function hasAllSelected(values: string[], selectedValues: string[]) {
  if (selectedValues.length === 0) return true;
  return selectedValues.every((selectedValue) => values.includes(selectedValue));
}

export default function TutorsPage() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(onboardingSubjects);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(onboardingLevels);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(onboardingLearningStyles);
  const [selectedUniversities, setSelectedUniversities] =
    useState<string[]>(onboardingUniversities);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(40);

  const [sortBy, setSortBy] = useState('Best match');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [requestedTutorIds, setRequestedTutorIds] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const filteredTutors = useMemo(() => {
    const matches = tutors.filter((tutor) => {
      const matchesSubject = hasAllSelected(tutor.subjects, selectedSubjects);
      const matchesLevel = hasAllSelected(tutor.levels, selectedLevels);
      const matchesStyle = hasAllSelected(tutor.learningStyles, selectedStyles);
      const matchesUniversity =
        selectedUniversities.length === 0 ||
        selectedUniversities.includes(tutor.university);

      const matchesPrice =
        tutor.pricePerHour >= minPrice && tutor.pricePerHour <= maxPrice;

      return (
        matchesSubject &&
        matchesLevel &&
        matchesStyle &&
        matchesUniversity &&
        matchesPrice
      );
    });

    return [...matches].sort((a, b) => {
      if (sortBy === 'Highest rated') return b.rating - a.rating;
      if (sortBy === 'Lowest price') return a.pricePerHour - b.pricePerHour;
      if (sortBy === 'Highest price') return b.pricePerHour - a.pricePerHour;

      const aScore =
        a.subjects.filter((subject) => selectedSubjects.includes(subject)).length +
        a.levels.filter((level) => selectedLevels.includes(level)).length +
        a.learningStyles.filter((style) => selectedStyles.includes(style)).length +
        (selectedUniversities.includes(a.university) ? 1 : 0);

      const bScore =
        b.subjects.filter((subject) => selectedSubjects.includes(subject)).length +
        b.levels.filter((level) => selectedLevels.includes(level)).length +
        b.learningStyles.filter((style) => selectedStyles.includes(style)).length +
        (selectedUniversities.includes(b.university) ? 1 : 0);

      return bScore - aScore || b.rating - a.rating;
    });
  }, [
    selectedSubjects,
    selectedLevels,
    selectedStyles,
    selectedUniversities,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const selectedTutor = filteredTutors.find((tutor) => tutor.id === selectedTutorId) ?? null;

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((current) => toggleValue(current, subject));
  };

  const handleLevelToggle = (level: string) => {
    setSelectedLevels((current) => toggleValue(current, level));
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles((current) => toggleValue(current, style));
  };

  const handleUniversityToggle = (university: string) => {
    setSelectedUniversities((current) => toggleValue(current, university));
  };

  const handleClearFilters = () => {
    setSelectedSubjects([]);
    setSelectedLevels([]);
    setSelectedStyles([]);
    setSelectedUniversities([]);
    setMinPrice(0);
    setMaxPrice(100);
    setSelectedTutorId(null);
  };

  const handleOnboardFilters = () => {
    setSelectedSubjects(onboardingSubjects);
    setSelectedLevels(onboardingLevels);
    setSelectedStyles(onboardingLearningStyles);
    setSelectedUniversities(onboardingUniversities);
    setMinPrice(0);
    setMaxPrice(40);
    setSelectedTutorId(null);
  };

  const handleBookTrialSession = async (tutor: Tutor) => {
    if (isBooking || requestedTutorIds.includes(tutor.id)) return;

    setIsBooking(true);

    try {
      await createTrialRequest({
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentName: 'Alex Student',
        subject: selectedSubjects[0] ?? tutor.subjects[0] ?? 'Any subject',
        level: selectedLevels[0] ?? tutor.levels[0] ?? 'Any level',
        learningStyle: selectedStyles[0] ?? tutor.learningStyles[0] ?? 'Any learning style',
        preferredTime: 'Weekday evening',
        message: 'I would like to book a trial session and see if this is a good fit.',
      });

      setRequestedTutorIds((current) =>
        current.includes(tutor.id) ? current : [...current, tutor.id]
      );

      alert(`Trial session request sent to ${tutor.name}.`);
    } catch (error) {
      console.error('Failed to create trial request:', error);
      alert('Could not send the trial request. Check Firebase setup and Firestore rules.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
              Tutor matching
            </p>

            <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Matched tutors.
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tutor-dashboard"
              className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200"
            >
              Tutor View
            </Link>

            <Link
              href="/preferences"
              className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
            >
              Edit Onboarding
            </Link>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
          <TutorFilters
            selectedSubjects={selectedSubjects}
            selectedLevels={selectedLevels}
            selectedStyles={selectedStyles}
            selectedUniversities={selectedUniversities}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onSubjectToggle={handleSubjectToggle}
            onLevelToggle={handleLevelToggle}
            onStyleToggle={handleStyleToggle}
            onUniversityToggle={handleUniversityToggle}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClear={handleClearFilters}
            onOnboardFilters={handleOnboardFilters}
          />

          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-500">
                Showing {filteredTutors.length} tutor{filteredTutors.length === 1 ? '' : 's'}
              </p>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-xl border-2 border-slate-950 bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#0f172a] outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div
              className={`grid gap-6 ${
                selectedTutor ? 'xl:grid-cols-[1fr_390px]' : 'xl:grid-cols-1'
              }`}
            >
              <div className={`grid gap-6 ${selectedTutor ? '' : 'xl:grid-cols-2'}`}>
                {filteredTutors.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                    selected={selectedTutorId === tutor.id}
                    onClick={() =>
                      setSelectedTutorId((current) =>
                        current === tutor.id ? null : tutor.id
                      )
                    }
                  />
                ))}

                {filteredTutors.length === 0 && (
                  <div className="rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-8 shadow-[6px_6px_0_#0f172a]">
                    <h2 className="text-2xl font-bold">No tutors found</h2>
                    <p className="mt-3 text-slate-600">
                      Try widening the subject, level, university, style or price filters.
                    </p>
                  </div>
                )}
              </div>

              {selectedTutor && (
                <aside className="sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-auto rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
                  <h2 className="text-2xl font-bold">{selectedTutor.name}</h2>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {selectedTutor.degree}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {selectedTutor.university}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border-2 border-slate-950 bg-white p-3 text-center">
                      <p className="text-lg font-black">★ {selectedTutor.rating}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">
                        {selectedTutor.reviews} reviews
                      </p>
                    </div>

                    <div className="rounded-xl border-2 border-slate-950 bg-white p-3 text-center">
                      <p className="text-lg font-black">{selectedTutor.numberOfStudents}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">
                        students
                      </p>
                    </div>

                    <div className="rounded-xl border-2 border-slate-950 bg-white p-3 text-center">
                      <p className="text-lg font-black">£{selectedTutor.pricePerHour}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">
                        per hour
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                    <p className="font-bold">About me</p>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {selectedTutor.bio}
                    </p>
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                    <p className="font-bold">Match details</p>

                    <div className="mt-4 space-y-4 text-sm">
                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          Levels
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {selectedTutor.levels.map((level) => (
                            <span
                              key={level}
                              className="rounded-lg border-2 border-slate-950 bg-cyan-100 px-3 py-1 font-bold"
                            >
                              {level}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          Subjects
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {selectedTutor.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-lg border-2 border-slate-950 bg-green-100 px-3 py-1 font-bold"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          Learning styles
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {selectedTutor.learningStyles.map((style) => (
                            <span
                              key={style}
                              className="rounded-lg border-2 border-slate-950 bg-purple-100 px-3 py-1 font-bold"
                            >
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          Availability
                        </p>

                        <span className="rounded-lg border-2 border-slate-950 bg-white px-3 py-1 font-bold">
                          {selectedTutor.availability}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                    <p className="font-bold">Hobbies</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTutor.hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="rounded-lg border-2 border-slate-950 bg-yellow-100 px-3 py-1 text-sm font-bold"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                    <p className="font-bold">Personality</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTutor.personality.map((trait) => (
                        <span
                          key={trait}
                          className="rounded-lg border-2 border-slate-950 bg-pink-100 px-3 py-1 text-sm font-bold"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      className="rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
                    >
                      Message
                    </button>

                    <button
                      type="button"
                      className="rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
                    >
                      Shortlist
                    </button>

                    <button
                      type="button"
                      disabled={isBooking || requestedTutorIds.includes(selectedTutor.id)}
                      onClick={() => handleBookTrialSession(selectedTutor)}
                      className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-200"
                    >
                      {requestedTutorIds.includes(selectedTutor.id)
                        ? 'Trial Session Requested'
                        : isBooking
                          ? 'Sending...'
                          : 'Book Trial Session'}
                    </button>
                  </div>
                </aside>
              )}
            </div>
          </section>
        </div>

        <div className="sticky bottom-4 z-30 mt-14 flex justify-start pb-4">
          <Link
            href="/preferences"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium shadow-[4px_4px_0_#0f172a] transition hover:bg-slate-50"
          >
            ← Back
          </Link>
        </div>
      </section>
    </main>
  );
}