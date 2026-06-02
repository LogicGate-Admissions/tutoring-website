const signals = [
  { label: '1,200+', sub: 'Verified tutors' },
  { label: '4.9 / 5', sub: 'Average rating' },
  { label: '40+', sub: 'Subjects covered' },
  { label: 'Same-day', sub: 'Bookings available' },
  { label: 'Oxford & Cambridge', sub: 'Tutors on platform' },
];

export default function TrustBar() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl overflow-x-auto px-6 lg:px-8">
        <div className="flex min-w-max items-center lg:min-w-0">
          {signals.map((signal, i) => (
            <div key={signal.label} className="flex items-center">
              <div className="px-6 py-5 sm:px-8">
                <p className="text-sm font-semibold text-slate-950">{signal.label}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{signal.sub}</p>
              </div>
              {i < signals.length - 1 && (
                <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
