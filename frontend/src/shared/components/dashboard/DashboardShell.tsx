/**
 * File purpose: Reusable two-column dashboard layout.
 *
 * Student and tutor dashboards both need left-side navigation, but their tabs
 * point to different role-specific routes. This component keeps the layout in
 * one place while each dashboard decides which links to show.
 */

import Link from 'next/link';
import { ReactNode } from 'react';
import { Container } from '@/shared/components/Container';
import { cn } from '@/shared/utils/cn';

export type DashboardNavItem = {
  label: string;
  href: string;
  active?: boolean;
  description: string;
};

type DashboardShellProps = {
  navItems: DashboardNavItem[];
  children: ReactNode;
  action?: ReactNode;
};

/** Layout wrapper with left-side navigation and a main content area. */
export function DashboardShell({ navItems, children, action }: DashboardShellProps) {
  return (
    <Container className="grid items-start gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-8">
        <div className="grid gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-2xl px-4 py-3 transition',
                item.active
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span
                className={cn(
                  'mt-1 block text-xs leading-5',
                  item.active ? 'text-slate-300' : 'text-slate-500'
                )}
              >
                {item.description}
              </span>
            </Link>
          ))}
        </div>

        {action && <div className="mt-4 border-t border-slate-200 pt-4">{action}</div>}
      </aside>

      <section className="min-w-0">{children}</section>
    </Container>
  );
}
