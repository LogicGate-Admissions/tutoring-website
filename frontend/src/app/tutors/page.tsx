'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import TutorCard from '../../components/tutors/TutorCard';
import TutorFilters from '../../components/tutors/TutorFilters';
import { createTrialRequest } from '../../lib/trialRequests';
import { sortOptions, tutors } from '../../lib/tutorOptions';
import type { Tutor } from '../../lib/tutorOptions';

const onboardingSubjects = ['Maths', 'Physics', 'Further Maths', 'TMUA', 'MAT'];
const onboardingLearningStyles = ['Visual explanations', 'Past-paper drilling'];
const onboardingUniversities = ['Imperial College London', 'University of Cambridge'];

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

function tutorMatchesSubjects(tutor: Tutor, selectedSubjects: string[]) {
  if (selectedSubjects.length === 0) return true;

  return selectedSubjects.some(
    (subject) => tutor.subjects.includes(subject) || tutor.levels.includes(subject)
  );
}

function tutorMatchesStyles(tutor: Tutor, selectedStyles: string[]) {
  if (selectedStyles.length === 0) return true;

  return selectedStyles.some((style) => tutor.learningStyles.includes(style));
}

function tutorMatchesUniversities(tutor: Tutor, selectedUniversities: string[]) {
  if (selectedUniversities.length === 0) return true;

  return selectedUniversities.includes(tutor.university);
}

function sortTutors(tutorsToSort: Tutor[], sort: string) {
  const sortedTutors = [...tutorsToSort];

  if (sort === 'Lowest Price') {
    return sortedTutors.sort((a, b) => a.hourlyRate - b.hourlyRate);
  }

  if (sort === 'Highest Price') {
    return sortedTutors.sort((a, b) => b.hourlyRate - a.hourlyRate);
  }

  if (sort === 'Most Reviews') {
    return sortedTutors.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  return sortedTutors.sort((a, b) => b.rating - a.rating);
}

export default function TutorsPage() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(onboardingSubjects);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(onboardingLearningStyles);
  const [selectedUniversities, setSelectedUniversities] =
    useState<string[]>(onboardingUniversities);

  const [sort, setSort] = useState('Top Rated');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [requestedTutorIds, setRequestedTutorIds] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const displayedTutors = useMemo(() => {
    const filteredTutors = tutors.filter(
      (tutor) =>
        tutorMatchesSubjects(tutor, selectedSubjects) &&
        tutorMatchesStyles(tutor, selectedStyles) &&
        tutorMatchesUniversities(tutor, selectedUniversities)
    );

    return sortTutors(filteredTutors, sort);
  }, [selectedSubjects, selectedStyles, selectedUniversities, sort]);

  const selectedTutor = tutors.find((tutor) => tutor.id === selectedTutorId) ?? null;

  const basedOnSummary = [
    selectedSubjects.length > 0 ? selectedSubjects.join(', ') : 'Any subject',
    selectedStyles.length > 0 ? selectedStyles.join(', ') : 'Any learning style',
    selectedUniversities.length > 0 ? selectedUniversities.join(', ') : 'Any university',
  ].join(' · ');

  const handleClearFilters = () => {
    setSelectedSubjects([]);
    setSelectedStyles([]);
    setSelectedUniversities([]);
    setSelectedTutorId(null);
  };

  const handleOnboardFilters = () => {
    setSelectedSubjects(onboardingSubjects);
    setSelectedStyles(onboardingLearningStyles);
    setSelectedUniversities(onboardingUniversities);
    setSelectedTutorId(null);
  };

  const handleTutorClick = (tutorId: string) => {
    setSelectedTutorId((current) => (current === tutorId ? null : tutorId));
  };

  const handleBookTrialSession = async (tutor: Tutor) => {
    try {
      setIsBooking(true);

      await createTrialRequest({
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentName: 'Alex Student',
        subject: selectedSubjects[0] ?? tutor.subjects[0] ?? 'Any subject',
        level: tutor.levels[0] ?? 'A-level',
        learningStyle: selectedStyles[0] ?? 'Any learning style',
        preferredTime: 'Weekday evening',
        message: 'I would like to book a trial session and see if this is a good fit.',
      });

      setRequestedTutorIds((current) =>
        current.includes(tutor.id) ? current : [...current, tutor.id]
      );
    } catch (error) {
      console.error(error);
      alert('Could not book trial session. Check Firebase is configured.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Tutor Matching
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Find a tutor
            </h1>

            <p className="mt-4 max-w-4xl text-base font-medium text-slate-600">
              Based on: {basedOnSummary}
            </p>

            <Link
              href="/preferences"
              className="mt-5 inline-flex rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
            >
              Change preferences
            </Link>
          </div>

          <Link
            href="/tutor-dashboard"
            className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200"
          >
            Tutor View
          </Link>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[300px_1fr]">
          <TutorFilters
            selectedSubjects={selectedSubjects}
            selectedStyles={selectedStyles}
            selectedUniversities={selectedUniversities}
            onSubjectToggle={(subject) =>
              setSelectedSubjects((current) => toggleValue(current, subject))
            }
            onStyleToggle={(style) =>
              setSelectedStyles((current) => toggleValue(current, style))
            }
            onUniversityToggle={(university) =>
              setSelectedUniversities((current) => toggleValue(current, university))
            }
            onClear={handleClearFilters}
            onOnboardFilters={handleOnboardFilters}
          />

          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg font-bold">
                {displayedTutors.length} tutor{displayedTutors.length === 1 ? '' : 's'} found
              </p>

              <label className="flex items-center gap-3 text-sm font-bold">
                Sort:
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="rounded-xl border-2 border-slate-950 bg-white px-4 py-2 font-semibold"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {displayedTutors.length === 0 && (
              <div className="rounded-[1.75rem] border-2 border-slate-950 bg-slate-50 p-8 text-center shadow-[6px_6px_0_#0f172a]">
                <h2 className="text-2xl font-bold">No tutors match those filters yet.</h2>
                <p className="mt-2 font-medium text-slate-600">
                  Try clearing filters or changing your preferences.
                </p>
              </div>
            )}

            <div
              className={`grid items-start gap-6 ${
                selectedTutor ? 'xl:grid-cols-[1fr_390px]' : 'xl:grid-cols-1'
              }`}
            >
              <div className={`grid gap-6 ${selectedTutor ? '' : 'xl:grid-cols-2'}`}>
                {displayedTutors.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                    selected={selectedTutor?.id === tutor.id}
                    onClick={() => handleTutorClick(tutor.id)}
                  />
                ))}
              </div>

              {selectedTutor && (
                <aside className="sticky top-6 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-slate-950 ${selectedTutor.avatarColour} text-4xl font-black shadow-[4px_4px_0_#0f172a]`}
                    >
                      {selectedTutor.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTutorId(null)}
                      className="rounded-xl border-2 border-slate-950 bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
                    >
                      Close profile
                    </button>
                  </div>

                  <h2 className="mt-5 text-3xl font-black">{selectedTutor.name}</h2>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Education: {selectedTutor.university}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border-2 border-slate-950 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Rating
                      </p>
                      <p className="mt-1 text-xl font-black">★ {selectedTutor.rating}</p>
                    </div>

                    <div className="rounded-xl border-2 border-slate-950 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Price
                      </p>
                      <p className="mt-1 text-xl font-black">
                        £{selectedTutor.hourlyRate}/hr
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    <div>
                      <p className="font-black uppercase tracking-[0.12em] text-slate-400">
                        Teaches
                      </p>
                      <p className="mt-1 font-bold">
                        {selectedTutor.subjects.join(' · ')}
                      </p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-[0.12em] text-slate-400">
                        Levels
                      </p>
                      <p className="mt-1 font-bold">{selectedTutor.levels.join(' · ')}</p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-[0.12em] text-slate-400">
                        Learning style
                      </p>
                      <p className="mt-1 font-bold">
                        {selectedTutor.learningStyles.join(' · ')}
                      </p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-[0.12em] text-slate-400">
                        Next slot
                      </p>
                      <p className="mt-1 font-bold">Available today · 18:00–19:00</p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-[0.12em] text-slate-400">
                        About
                      </p>
                      <p className="mt-1 leading-6 text-slate-700">{selectedTutor.bio}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 pb-2">
                    <button
                      type="button"
                      className="w-full rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
                    >
                      Message
                    </button>

                    <button
                      type="button"
                      className="w-full rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
                    >
                      Shortlist
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookTrialSession(selectedTutor)}
                      disabled={isBooking || requestedTutorIds.includes(selectedTutor.id)}
                      className="w-full rounded-xl border-2 border-slate-950 bg-cyan-100 px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-green-100"
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

        <div className="mt-14 flex justify-between pb-6">
          <Link
            href="/preferences"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium transition hover:bg-slate-50"
          >
            ← Back
          </Link>

          <button
            type="button"
            className="rounded-xl border-2 border-slate-950 bg-white px-8 py-3 text-xl font-medium transition hover:bg-slate-50"
          >
            Finish
          </button>
        </div>
      </section>
    </main>
  );
}