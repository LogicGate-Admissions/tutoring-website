import {
  learningStyleFilters,
  subjectFilters,
  universityFilters,
} from '../../lib/tutorOptions';

type TutorFiltersProps = {
  selectedSubject: string;
  selectedStyle: string;
  selectedUniversity: string;
  onSubjectChange: (subject: string) => void;
  onStyleChange: (style: string) => void;
  onUniversityChange: (university: string) => void;
  onClear: () => void;
};

export default function TutorFilters({
  selectedSubject,
  selectedStyle,
  selectedUniversity,
  onSubjectChange,
  onStyleChange,
  onUniversityChange,
  onClear,
}: TutorFiltersProps) {
  return (
    <aside className="h-fit rounded-[1.75rem] border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
      <h2 className="text-xl font-bold">Find a tutor</h2>

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-500">
            Learning Style
          </label>

          <select
            value={selectedStyle}
            onChange={(event) => onStyleChange(event.target.value)}
            className="w-full rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold"
          >
            {learningStyleFilters.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-500">
            University
          </label>

          <select
            value={selectedUniversity}
            onChange={(event) => onUniversityChange(event.target.value)}
            className="w-full rounded-xl border-2 border-slate-950 bg-white px-4 py-3 font-semibold"
          >
            {universityFilters.map((university) => (
              <option key={university} value={university}>
                {university}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-500">Subject</p>

          <div className="flex flex-wrap gap-2">
            {subjectFilters.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => onSubjectChange(subject)}
                className={`rounded-full border-2 border-slate-950 px-3 py-1 text-sm font-bold transition ${
                  selectedSubject === subject
                    ? 'bg-cyan-100 shadow-[2px_2px_0_#0f172a]'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50"
        >
          Clear Filters
        </button>
      </div>
    </aside>
  );
}