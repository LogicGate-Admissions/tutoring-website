const signals = [
  { icon: '🎓', label: '1,200+', sub: 'Verified Tutors' },
  { icon: '⭐', label: '4.9 / 5', sub: 'Average Rating' },
  { icon: '📚', label: '40+', sub: 'Subjects' },
  { icon: '⚡', label: 'Same-day', sub: 'Bookings Available' },
  { icon: '🏛️', label: 'Oxford & Cambridge', sub: 'Tutors on Platform' },
];

export default function TrustBar() {
  return (
    <section className="border-y-2 border-slate-950 bg-surface-soft">
      <div className="mx-auto max-w-7xl overflow-x-auto px-6 lg:px-12">
        <div className="flex min-w-max items-center justify-between gap-0 py-0 lg:min-w-0">
          {signals.map((signal, i) => (
            <div key={signal.label} className="flex items-center">
              <div className="flex items-center gap-3 px-6 py-5 sm:px-8">
                <span className="text-xl" role="img" aria-label={signal.sub}>
                  {signal.icon}
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950 sm:text-base">{signal.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{signal.sub}</p>
                </div>
              </div>
              {i < signals.length - 1 && (
                <div className="h-8 w-px bg-slate-300" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
