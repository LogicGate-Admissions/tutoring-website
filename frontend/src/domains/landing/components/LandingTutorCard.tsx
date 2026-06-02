import type { Tutor } from '@/domains/tutors/tutor-discovery/types/tutor';
import { tutorInitials } from '@/domains/tutors/tutor-discovery/utils/tutorDisplay';

type LandingTutorCardProps = {
  tutor: Tutor;
  onGateClick: () => void;
};

function avatarColor(name: string) {
  const colors = ['bg-cyan-100', 'bg-green-100', 'bg-purple-100', 'bg-yellow-100', 'bg-pink-100', 'bg-orange-100'];
  const index = Math.abs(name.split('').reduce((t, c) => t + c.charCodeAt(0), 0)) % colors.length;
  return colors[index] ?? 'bg-cyan-100';
}

export default function LandingTutorCard({ tutor, onGateClick }: LandingTutorCardProps) {
  return (
    <article
      className="group flex cursor-pointer flex-col rounded-[1.75rem] border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a]"
      role="button"
      tabIndex={0}
      onClick={onGateClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onGateClick();
        }
      }}
      aria-label={`View ${tutor.name}'s profile`}
    >
      {/* Avatar + header */}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 ${avatarColor(tutor.name)} text-lg font-black shadow-[3px_3px_0_#0f172a]`}
        >
          {tutorInitials(tutor.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-950">{tutor.name}</h3>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate max-w-[140px]">
                {tutor.university}
              </p>
            </div>
            <div className="shrink-0 rounded-lg border-2 border-slate-950 bg-white px-2 py-1 text-xs font-bold text-slate-950">
              £{tutor.pricePerHour}/hr
            </div>
          </div>
        </div>
      </div>

      {/* Subject tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tutor.subjects.slice(0, 3).map((subject) => (
          <span
            key={subject}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700"
          >
            {subject}
          </span>
        ))}
      </div>

      {/* Bio */}
      <p className="mt-3 flex-1 line-clamp-2 text-sm font-medium leading-6 text-slate-600">
        {tutor.bio}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">★ {tutor.rating}</p>
          <p className="text-[11px] font-semibold text-slate-500">{tutor.reviews} reviews</p>
        </div>
        <span className="rounded-xl border-2 border-slate-950 bg-surface-soft px-4 py-2 text-xs font-bold text-slate-950 transition group-hover:bg-brand-primary group-hover:text-white">
          See Profile →
        </span>
      </div>
    </article>
  );
}
