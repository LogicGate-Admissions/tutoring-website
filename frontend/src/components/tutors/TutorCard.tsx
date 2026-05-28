import { Tutor } from '../../lib/tutorOptions';

type TutorCardProps = {
  tutor: Tutor;
  requestStatus: 'none' | 'pending' | 'accepted';
  onRequest: () => void;
};

export default function TutorCard({ tutor, requestStatus, onRequest }: TutorCardProps) {
  return (
    <article className="rounded-[1.75rem] border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{tutor.name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{tutor.university}</p>
        </div>

        <div className="rounded-xl border-2 border-slate-950 bg-cyan-100 px-3 py-2 text-right font-bold">
          £{tutor.hourlyRate}/hr
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tutor.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border-2 border-slate-950 bg-slate-50 px-3 py-1 text-xs font-bold"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-5 text-sm font-medium leading-6 text-slate-700">{tutor.bio}</p>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border-2 border-slate-950 bg-[#f7fbff] p-3">
          <p className="font-bold">Subjects</p>
          <p className="mt-1 text-slate-600">{tutor.subjects.join(' · ')}</p>
        </div>

        <div className="rounded-xl border-2 border-slate-950 bg-[#f7fbff] p-3">
          <p className="font-bold">Learning style</p>
          <p className="mt-1 text-slate-600">{tutor.learningStyles.join(' · ')}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-black">★ {tutor.rating}</p>
          <p className="text-xs font-semibold text-slate-500">{tutor.reviewCount} reviews</p>
        </div>

        {requestStatus === 'none' && (
          <button
            type="button"
            onClick={onRequest}
            className="rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-cyan-50"
          >
            Request match
          </button>
        )}

        {requestStatus === 'pending' && (
          <button
            type="button"
            disabled
            className="rounded-xl border-2 border-slate-950 bg-yellow-100 px-5 py-3 text-sm font-bold"
          >
            Request pending
          </button>
        )}

        {requestStatus === 'accepted' && (
          <button
            type="button"
            disabled
            className="rounded-xl border-2 border-slate-950 bg-green-100 px-5 py-3 text-sm font-bold"
          >
            Match accepted
          </button>
        )}
      </div>
    </article>
  );
}