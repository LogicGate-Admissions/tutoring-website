import Link from 'next/link';

export default function DualCTA() {
  return (
    <section id="for-tutors" className="border-t border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 shadow-sm lg:grid-cols-2">
          {/* Student panel */}
          <div className="bg-slate-950 p-10 lg:p-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              For students
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white text-wrap-balance lg:text-3xl">
              Ready to find your tutor?
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              Join students already learning with our vetted tutors from Oxford, Cambridge, Imperial, and more.
            </p>
            <Link
              href="/signup?role=student"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
            >
              Sign up as a student
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Tutor panel */}
          <div className="border-t border-slate-200 bg-[#f8f7f4] p-10 lg:border-l lg:border-t-0 lg:p-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              For tutors
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950 text-wrap-balance lg:text-3xl">
              Are you a tutor?
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
              Set your own hours, subjects, and rates. Reach students who are actively looking for you.
            </p>
            <Link
              href="/signup?role=tutor"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-50"
            >
              Apply as a tutor
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
