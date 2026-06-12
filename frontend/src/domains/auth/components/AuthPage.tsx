'use client';

/**
 * File purpose: Shared Firebase login/sign-up screen for students and tutors.
 *
 * The student and tutor routes both use this component, but pass different
 * roles. That gives us one polished auth form while still keeping student and
 * tutor account types separate in Firebase/Firestore.
 */

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BrandHomeLink } from '@/shared/components/BrandHomeLink';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Container } from '@/shared/components/Container';
import { PageHeader } from '@/shared/components/PageHeader';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { ROUTES } from '@/shared/constants/routes';
import {
  authenticateWithEmailAndPassword,
  continueWithGoogle,
  signOutCurrentUser,
  subscribeToCurrentUser,
} from '@/domains/auth/services/authService';
import type { AuthMode, AuthRole, AuthUser } from '@/domains/auth/types/auth';

type AuthPageProps = {
  role: AuthRole;
};

type AuthCopy = {
  eyebrow: string;
  title: string;
  description: string;
  switchLabel: string;
  switchHref: string;
  onboardingRoute: string;
  dashboardRoute: string;
};

function getAuthCopy(role: AuthRole): AuthCopy {
  /** Keep role-specific wording outside the JSX so the render stays readable. */
  if (role === 'student') {
    return {
      eyebrow: 'Student access',
      title: 'Log in or sign up as a student',
      description:
        'Create a student account to save your learning profile, browse matched tutors, and manage match requests.',
      switchLabel: 'I am a tutor',
      switchHref: ROUTES.tutorLogin,
      onboardingRoute: ROUTES.studentOnboardingSubjects,
      dashboardRoute: ROUTES.studentDashboard,
    };
  }

  return {
    eyebrow: 'Tutor access',
    title: 'Log in or sign up as a tutor',
    description:
      'Create a tutor account to build your tutor profile, receive match requests, and manage your tutor area.',
    switchLabel: 'I am a student',
    switchHref: ROUTES.studentLogin,
    onboardingRoute: ROUTES.tutorOnboarding,
    dashboardRoute: ROUTES.tutorDashboard,
  };
}

function getNextRouteAfterAuth(account: AuthUser, copy: AuthCopy) {
  /** New accounts go through onboarding; completed accounts can enter dashboard. */
  return account.hasCompletedOnboarding ? copy.dashboardRoute : copy.onboardingRoute;
}


function AuthShell({ children }: { children: ReactNode }) {
  /** Login and sign-up pages need an obvious route back to the landing page. */
  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <Container className="flex items-center justify-between pt-6">
        <BrandHomeLink />
        <ThemeToggle />
      </Container>
      {children}
    </main>
  );
}

function friendlyAuthError(error: unknown) {
  /** Firebase errors are useful for developers but too noisy for users. */
  if (!(error instanceof Error)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.message.includes('auth/email-already-in-use')) {
    return 'An account already exists with this email. Switch to Log in.';
  }

  if (error.message.includes('auth/invalid-credential')) {
    return 'The email or password is incorrect.';
  }

  if (error.message.includes('auth/weak-password')) {
    return 'Please use a password with at least 6 characters.';
  }

  if (error.message.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in was closed before it finished.';
  }

  return error.message;
}

export function AuthPage({ role }: AuthPageProps) {
  const router = useRouter();
  const copy = useMemo(() => getAuthCopy(role), [role]);

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedExistingSession, setHasCheckedExistingSession] = useState(false);
  const [signedInAsDifferentRole, setSignedInAsDifferentRole] = useState<AuthUser | null>(null);

  useEffect(() => {
    /**
     * Firebase keeps users signed in across pages. If someone returns to the
     * landing page and clicks Get Started again, send them straight back into
     * their existing area instead of asking them to log in twice.
     */
    const unsubscribe = subscribeToCurrentUser((currentUser) => {
      if (!currentUser) {
        setSignedInAsDifferentRole(null);
        setHasCheckedExistingSession(true);
        return;
      }

      if (currentUser.role === role) {
        router.replace(getNextRouteAfterAuth(currentUser, copy));
        return;
      }

      setSignedInAsDifferentRole(currentUser);
      setHasCheckedExistingSession(true);
    });

    return () => unsubscribe();
  }, [copy, role, router]);

  async function finishAuth(account: AuthUser) {
    /** Centralise routing so email and Google auth behave the same way. */
    router.push(getNextRouteAfterAuth(account, copy));
  }

  async function handleSignOutDifferentRole() {
    setIsSubmitting(true);
    setError(null);

    try {
      await signOutCurrentUser();
      setSignedInAsDifferentRole(null);
    } catch (caughtError) {
      setError(friendlyAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEmailPasswordForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    /** Sign-up needs a name because it becomes the first profile display name. */
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name to create an account.');
      return;
    }

    /** Firebase Auth needs email/password for both login and sign-up. */
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const account = await authenticateWithEmailAndPassword(mode, role, {
        name,
        email,
        password,
      });

      await finishAuth(account);
    } catch (caughtError) {
      setError(friendlyAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitGoogleAuth() {
    setError(null);
    setIsSubmitting(true);

    try {
      const account = await continueWithGoogle(role);
      await finishAuth(account);
    } catch (caughtError) {
      setError(friendlyAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasCheckedExistingSession) {
    return (
      <AuthShell>
        <Container className="py-16">
          <p className="text-sm text-slate-600">Checking your session...</p>
        </Container>
      </AuthShell>
    );
  }

  if (signedInAsDifferentRole) {
    const signedInDashboard =
      signedInAsDifferentRole.role === 'student' ? ROUTES.studentDashboard : ROUTES.tutorDashboard;

    return (
      <AuthShell>
        <PageHeader
          eyebrow="Already signed in"
          title={`You are signed in as a ${signedInAsDifferentRole.role}`}
          description={`To continue as a ${role}, sign out first. Otherwise, go back to your current dashboard.`}
        />

        <Container className="max-w-2xl py-10">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button href={signedInDashboard}>Go to dashboard</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSignOutDifferentRole}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing out...' : `Sign out to use ${role} login`}
              </Button>
            </div>

            {error && (
              <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}
          </Card>
        </Container>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <Container className="max-w-2xl py-10">
        <Card>
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {(['login', 'signup'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option);
                  setError(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === option
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {option === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={submitEmailPasswordForm} className="grid gap-5">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-800" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800" htmlFor="password">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'signup'
                  ? `Create ${role} account`
                  : `Log in as ${role}`}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={submitGoogleAuth}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="mt-5 flex justify-center">
            <Button href={copy.switchHref} variant="secondary">
              {copy.switchLabel}
            </Button>
          </div>
        </Card>
      </Container>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
