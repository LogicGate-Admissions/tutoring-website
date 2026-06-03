'use client';

/** File purpose: Shared Firebase sign-out button. */

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { ROUTES } from '@/shared/constants/routes';
import { signOutCurrentUser } from '@/domains/auth/services/authService';

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    /** Firebase clears the browser session; routing returns user to public app. */
    await signOutCurrentUser();
    router.push(ROUTES.home);
  }

  return (
    <Button type="button" variant="secondary" onClick={signOut}>
      Sign out
    </Button>
  );
}
