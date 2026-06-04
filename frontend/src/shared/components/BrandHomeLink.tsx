/**
 * File purpose: Shared LogicGate brand link that returns users to the public landing page.
 *
 * Keeping the logo in one small component avoids landing/auth pages drifting away from the
 * signed-in app header style.
 */

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

type BrandHomeLinkProps = {
  className?: string;
};

/** Brand mark used wherever the app needs a clear route back to the landing page. */
export function BrandHomeLink({ className = '' }: BrandHomeLinkProps) {
  return (
    <Link
      href={ROUTES.home}
      className={`flex items-center gap-3 rounded-2xl text-slate-950 transition hover:opacity-80 ${className}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
        LG
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold">LogicGate</span>
        <span className="block text-xs text-slate-500">Admissions</span>
      </span>
    </Link>
  );
}
