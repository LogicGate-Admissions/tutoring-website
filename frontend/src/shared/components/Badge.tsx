/**
 * File purpose: Reusable UI component shared across domains. Keep it generic and product-agnostic.
 */

import { cn } from '@/shared/utils/cn';

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Small label component used for tags, statuses, and categories.
 */
export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700',
        className
      )}
    >
      {children}
    </span>
  );
}
