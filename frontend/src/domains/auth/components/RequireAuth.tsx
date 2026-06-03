'use client';

/**
 * File purpose: Firebase-backed client route guard.
 *
 * Next.js app routes render before Firebase Auth has confirmed the browser
 * session. This guard shows a loading state, then either renders protected
 * content or redirects to the correct role login page.
 */

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import type { AuthRole, AuthUser } from '@/domains/auth/types/auth';

type RequireAuthProps = {
  role: AuthRole;
  children: ReactNode;
};

function getLoginRouteForRole(role: AuthRole) {
  return role === 'student' ? ROUTES.studentLogin : ROUTES.tutorLogin;
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    /** Subscribe once and let Firebase notify us when auth state changes. */
    const unsubscribe = subscribeToCurrentUser((user) => {
      if (!user || user.role !== role) {
        router.replace(getLoginRouteForRole(role));
        setCurrentUser(null);
        setHasCheckedSession(true);
        return;
      }

      setCurrentUser(user);
      setHasCheckedSession(true);
    });

    return () => unsubscribe();
  }, [role, router]);

  if (!hasCheckedSession || !currentUser) {
    return (
      <main className="min-h-screen bg-[#f8f7f4] py-16">
        <Container>
          <p className="text-sm text-slate-600">Checking your session...</p>
        </Container>
      </main>
    );
  }

  return <>{children}</>;
}
