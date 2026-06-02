/**
 * File purpose: Small preferences UI/helper file used by the student learning profile flow.
 */

/**
 * Small preference-state helpers.
 *
 * These functions keep React components readable: components decide when a user
 * action happened, helpers decide how arrays should change.
 */

export function toggleSelectedValue(values: string[], value: string) {
  /** Remove an existing value, otherwise append it. */
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function addUniqueValue(values: string[], value: string) {
  /** Ignore empty and duplicate values so UI state stays clean. */
  if (!value || values.includes(value)) return values;
  return [...values, value];
}

export function removeValue(values: string[], value: string) {
  /** Return a new array so React detects the state change. */
  return values.filter((item) => item !== value);
}
