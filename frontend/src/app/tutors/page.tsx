'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import TutorCard from '../../components/tutors/TutorCard';
import TutorFilters from '../../components/tutors/TutorFilters';
import { sortOptions, Tutor, tutors } from '../../lib/tutorOptions';

type RequestStatus = 'none' | 'pending' | 'accepted';

function tutorMatchesSubject(tutor: Tutor, selectedSubject: string) {
  if (selectedSubject === 'All') {
    return true;
  }

  return tutor.subjects.includes(selectedSubject);
}

function tutorMatchesStyle(tutor: Tutor, selectedStyle: string) {
  if (selectedStyle === 'Any Style') {
    return true;
  }

  return tutor.learningStyles.includes(selectedStyle);
}

function tutorMatchesUniversity(tutor: Tutor, selectedUniversity: string) {
  if (selectedUniversity === 'Any University') {
    return true;
  }

  return tutor.university === selectedUniversity;
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
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStyle, setSelectedStyle] = useState('Any Style');
  const [selectedUniversity, setSelectedUniversity] = useState('Any University');
  const [sort, setSort] = useState('Top Rated');
  const [requests, setRequests] = useState<Record<string, RequestStatus>>({});

  const displayedTutors = useMemo(() => {
    const filteredTutors = tutors.filter(
      (tutor) =>
        tutorMatchesSubject(tutor, selectedSubject) &&
        tutorMatchesStyle(tutor, selectedStyle) &&
        tutorMatchesUniversity(tutor, selectedUniversity)
    );

    return sortTutors(filteredTutors, sort);
  }, [selectedSubject, selectedStyle, selectedUniversity, sort]);

  const handleClearFilters = () => {
    setSelectedSubject('All');
    setSelectedStyle('Any Style');
    setSelectedUniversity('Any University');
  };

  const handleRequestMatch = (tutorId: string) => {
    setRequests((current) => ({
      ...current,
      [tutorId]: 'pending',
    }));
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

            <p className="mt-4 max-w-3xl text-base font-medium text-slate-600">
              Based on: A-level · Maths · Weekday evenings · Visual explanations
            </p>
          </div>

          <Link
            href="/preferences"
            className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
          >
            Change preferences
          </Link>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[300px_1fr]">
          <TutorFilters
            selectedSubject={selectedSubject}
            selectedStyle={selectedStyle}
            selectedUniversity={selectedUniversity}
            onSubjectChange={setSelectedSubject}
            onStyleChange={setSelectedStyle}
            onUniversityChange={setSelectedUniversity}
            onClear={handleClearFilters}
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

            <div className="grid gap-6 xl:grid-cols-2">
              {displayedTutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  requestStatus={requests[tutor.id] ?? 'none'}
                  onRequest={() => handleRequestMatch(tutor.id)}
                />
              ))}
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