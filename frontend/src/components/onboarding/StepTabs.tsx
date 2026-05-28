export default function StepTabs() {
  return (
    <nav className="fixed bottom-6 left-1/2 z-20 w-[min(720px,calc(100%-32px))] -translate-x-1/2 rounded-[2rem] border-2 border-slate-950 bg-white px-5 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
      <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold text-slate-950">
        <span className="rounded-full bg-cyan-100 px-4 py-2 ring-2 ring-slate-950">
          Subjects
        </span>
        <span className="rounded-full px-4 py-2 text-slate-500">Time</span>
        <span className="rounded-full px-4 py-2 text-slate-500">Preferences</span>
      </div>
    </nav>
  );
}