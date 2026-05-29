'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  updateTrialRequestStatus,
  type TrialRequest,
  type TrialRequestStatus,
} from '../../lib/trialRequests';
import { tutors } from '../../lib/tutorOptions';

function statusClasses(status: TrialRequestStatus) {
  if (status === 'accepted') return 'bg-green-100';
  if (status === 'rejected') return 'bg-red-100';

  return 'bg-yellow-100';
}

export default function TutorDashboardPage() {
  const [requests, setRequests] = useState<TrialRequest[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id ?? '');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'trialSessionRequests'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextRequests = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as TrialRequest[];

      setRequests(nextRequests);
    });

    return () => unsubscribe();
  }, []);

  const selectedTutor = tutors.find((tutor) => tutor.id === selectedTutorId) ?? tutors[0];

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => request.tutorId === selectedTutorId);
  }, [requests, selectedTutorId]);

  const pendingCount = visibleRequests.filter((request) => request.status === 'pending').length;

  const handleStatusChange = async (requestId: string, status: TrialRequestStatus) => {
    try {
      setUpdatingId(requestId);
      await updateTrialRequestStatus(requestId, status);
    } catch (error) {
      console.error(error);
      alert('Could not update request.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-4 text-slate-950 sm:px-8 lg:px-12">
      <section className="mx-auto min-h-[calc(100vh-32px)] max-w-7xl rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Tutor View
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Trial session requests
            </h1>
          </div>

          <Link
            href="/tutors"
            className="rounded-xl border-2 border-slate-950 bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
          >
            Student View
          </Link>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-[#f7fbff] p-6 shadow-[6px_6px_0_#0f172a]">
            <h2 className="text-xl font-bold">Viewing as tutor</h2>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-500">
                Tutor account
              </span>

              <select
                value={selectedTutorId}
                onChange={(event) => setSelectedTutorId(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold"
              >
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedTutor && (
              <div className="mt-6 rounded-[1.25rem] border-2 border-slate-950 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">Current tutor</p>
                <p className="mt-1 text-xl font-black">{selectedTutor.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedTutor.university}
                </p>

                <div className="mt-4 rounded-xl border-2 border-slate-950 bg-yellow-100 px-3 py-2 font-bold">
                  {pendingCount} pending request{pendingCount === 1 ? '' : 's'}
                </div>
              </div>
            )}
          </aside>

          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                Requests for {selectedTutor?.name ?? 'tutor'}
              </h2>

              <p className="rounded-xl border-2 border-slate-950 bg-white px-4 py-2 text-sm font-bold">
                {visibleRequests.length} total
              </p>
            </div>

            {visibleRequests.length === 0 && (
              <div className="rounded-[1.75rem] border-2 border-slate-950 bg-slate-50 p-8 text-center shadow-[6px_6px_0_#0f172a]">
                <h3 className="text-2xl font-bold">No requests yet.</h3>
                <p className="mt-2 font-medium text-slate-600">
                  Go to Student View, choose this tutor, and click Book Trial Session.
                </p>
              </div>
            )}

            <div className="grid gap-5">
              {visibleRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[1.75rem] border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{request.studentName}</h3>

                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        wants a trial session with {request.tutorName}
                      </p>
                    </div>

                    <span
                      className={`rounded-xl border-2 border-slate-950 px-4 py-2 text-sm font-black capitalize ${statusClasses(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border-2 border-slate-950 bg-[#f7fbff] p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Subject
                      </p>
                      <p className="mt-1 font-bold">{request.subject}</p>
                    </div>

                    <div className="rounded-xl border-2 border-slate-950 bg-[#f7fbff] p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Level
                      </p>
                      <p className="mt-1 font-bold">{request.level}</p>
                    </div>

                    <div className="rounded-xl border-2 border-slate-950 bg-[#f7fbff] p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Learning style
                      </p>
                      <p className="mt-1 font-bold">{request.learningStyle}</p>
                    </div>

                    <div className="rounded-xl border-2 border-slate-950 bg-[#f7fbff] p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Preferred time
                      </p>
                      <p className="mt-1 font-bold">{request.preferredTime}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border-2 border-slate-950 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Student message
                    </p>
                    <p className="mt-2 font-medium text-slate-700">{request.message}</p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={updatingId === request.id}
                        onClick={() => handleStatusChange(request.id, 'accepted')}
                        className="rounded-xl border-2 border-slate-950 bg-green-100 px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-green-200 disabled:cursor-not-allowed"
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === request.id}
                        onClick={() => handleStatusChange(request.id, 'rejected')}
                        className="rounded-xl border-2 border-slate-950 bg-red-100 px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-red-200 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status !== 'pending' && (
                    <p className="mt-5 text-sm font-bold text-slate-500">
                      This request has already been {request.status}.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}