/**
 * File purpose: Reusable UI component shared across domains. Keep it generic and product-agnostic.
 */

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

type HomeLinkButtonProps = {
  label?: string;
};

/**
 * Small reusable link back to the landing page.
 *
 * Used in onboarding and tutor discovery so the user always has a clear
 * escape route back home without cluttering the bottom onboarding nav.
 */
export function HomeLinkButton({ label = 'Home' }: HomeLinkButtonProps) {
  return (
    <Link
      href={ROUTES.home}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span aria-hidden="true">⌂</span>
      <span>{label}</span>
    </Link>
  );
}