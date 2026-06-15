/** Shared formatting for subject/level labels shown across the app. */

function cleanPart(value?: string | null) {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

/** Formats a level/subject pair in the app style, e.g. "A-level · Maths". */
export function formatSubjectLevelLabel(level?: string | null, subject?: string | null) {
  const parts = [cleanPart(level), cleanPart(subject)].filter(Boolean);
  return parts.join(' · ');
}

/**
 * Uses structured level/subject data when available, otherwise tidies an existing label.
 * This keeps old stored labels such as "A-level Maths" readable without losing fallbacks.
 */
export function formatStoredSubjectLabel({
  level,
  subject,
  label,
}: {
  level?: string | null;
  subject?: string | null;
  label?: string | null;
}) {
  const formatted = formatSubjectLevelLabel(level, subject);
  if (formatted) return formatted;

  return cleanPart(label).replace(/\s*·\s*/g, ' · ');
}

/** Normalises a label for comparison while treating the display dot as spacing. */
export function normaliseSubjectComparable(value: string) {
  return value
    .trim()
    .replace(/\s*·\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
