import { subjectColourClasses } from '../../lib/tutorOptions';
import type { Tutor } from '../../lib/tutorOptions';

type TutorCardProps = {
  tutor: Tutor;
  selected: boolean;
  onClick: () => void;
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function subjectColour(subject: string) {
  const index = Math.abs(
    subject.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  ) % subjectColourClasses.length;

  return subjectColourClasses[index] ?? 'bg-slate-400';
}

function levelColour(level: string) {
  if (['A-level', 'GCSE', 'IB', 'IGCSE', 'IAL', 'Scottish Highers'].includes(level)) {
    return 'bg-cyan-500';
  }

  if (level === 'University admissions') {
    return 'bg-purple-500';
  }

  return 'bg-slate-400';
}

function styleColour(style: string) {
  if (style === 'Visual explanations') return 'bg-blue-500';
  if (style === 'Past-paper drilling') return 'bg-pink-500';
  if (style === 'Step-by-step examples') return 'bg-emerald-500';
  if (style === 'Socratic questioning') return 'bg-orange-500';
  if (style === 'Timed practice') return 'bg-purple-500';
  if (style === 'Interactive coding') return 'bg-cyan-500';
  if (style === 'Essay planning') return 'bg-yellow-500';

  return 'bg-slate-400';
}

function avatarColour(name: string) {
  const colours = [
    'bg-cyan-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-yellow-100',
    'bg-pink-100',
    'bg-orange-100',
  ];

  const index = Math.abs(
    name.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  ) % colours.length;

  return colours[index];
}

export default function TutorCard({ tutor, selected, onClick }: TutorCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`cursor-pointer rounded-[1.75rem] border-2 border-slate-950 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a] ${
        selected
          ? 'shadow-[8px_8px_0_#0f172a] ring-4 ring-cyan-100'
          : 'shadow-[6px_6px_0_#0f172a]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 ${avatarColour(
            tutor.name
          )} text-3xl font-black shadow-[3px_3px_0_#0f172a]`}
        >
          {initials(tutor.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{tutor.name}</h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {tutor.university}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {tutor.degree}
              </p>
            </div>

            <div className="rounded-xl border-2 border-slate-950 bg-white px-3 py-2 text-right font-bold">
              £{tutor.pricePerHour}/hr
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Levels
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-bold">
                {tutor.levels.map((level) => (
                  <span key={level} className="inline-flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${levelColour(level)}`} />
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Subjects
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-bold">
                {tutor.subjects.map((subject) => (
                  <span key={subject} className="inline-flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${subjectColour(subject)}`} />
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Learning styles
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-bold">
                {tutor.learningStyles.map((style) => (
                  <span key={style} className="inline-flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${styleColour(style)}`} />
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 text-sm font-medium leading-6 text-slate-700">
        {tutor.bio}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-black">★ {tutor.rating}</p>

          <p className="text-xs font-semibold text-slate-500">
            {tutor.reviews} reviews
          </p>
        </div>

        <div className="text-right">
          <p className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-4 py-2 text-sm font-bold">
            {selected ? 'Close profile ↑' : 'View profile →'}
          </p>
        </div>
      </div>
    </article>
  );
}