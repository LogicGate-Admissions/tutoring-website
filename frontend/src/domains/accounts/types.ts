/**
 * Supported account roles.
 *
 * We keep this strict so random role names cannot accidentally enter the app.
 */
export type UserRole = 'student' | 'tutor';

/**
 * Minimal user shape for the current prototype.
 *
 * Real authentication can later replace the mock current users without changing
 * the rest of the domain code too much.
 */
export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
};
