import Link from 'next/link';

export default function DualCTA() {
  return (
    <section id="for-tutors" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid overflow-hidden rounded-[2rem] border-2 border-slate-950 shadow-[8px_8px_0_#0f172a] lg:grid-cols-2">
          {/* Student panel */}
          <div className="bg-brand-accent p-10 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-950/60">
              For Students
            </p>
            <h2
              className="mt-4 font-serif font-bold text-slate-950 text-wrap-balance"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', letterSpacing: '-0.025em' }}
            >
              Ready to find your tutor?
            </h2>
            <p className="mt-4 max-w-sm text-sm font-medium leading-7 text-slate-900/70">
              Join students already learning with our vetted tutors from Oxford, Cambridge, Imperial, and more.
            </p>
            <Link
              href="/signup?role=student"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-slate-950 px-7 py-3.5 text-sm font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.3)] transition hover:bg-slate-800 hover:shadow-[5px_5px_0_rgba(0,0,0,0.3)] active:translate-x-px active:translate-y-px"
            >
              Sign Up as a Student
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Tutor panel */}
          <div className="border-t-2 border-slate-950 bg-white p-10 lg:border-l-2 lg:border-t-0 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              For Tutors
            </p>
            <h2
              className="mt-4 font-serif font-bold text-slate-950 text-wrap-balance"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', letterSpacing: '-0.025em' }}
            >
              Are you a tutor?
            </h2>
            <p className="mt-4 max-w-sm text-sm font-medium leading-7 text-slate-600">
              Set your own hours, subjects, and rates. Reach students who are actively looking for you. Start earning on your own terms.
            </p>
            <Link
              href="/signup?role=tutor"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-white px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:bg-slate-50 hover:shadow-[5px_5px_0_#0f172a] active:translate-x-px active:translate-y-px"
            >
              Apply as a Tutor
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
