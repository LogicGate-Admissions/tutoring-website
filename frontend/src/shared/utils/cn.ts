/**
 * Combines CSS class names into one string.
 *
 * This keeps conditional Tailwind styling readable.
 */
export function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}
