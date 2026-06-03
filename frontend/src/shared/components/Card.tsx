/**
 * File purpose: Reusable UI component shared across domains. Keep it generic and product-agnostic.
 */

import { cn } from '@/shared/utils/cn';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared card component for grouped information.
 */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
