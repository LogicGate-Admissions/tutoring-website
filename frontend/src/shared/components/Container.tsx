/**
 * File purpose: Reusable UI component shared across domains. Keep it generic and product-agnostic.
 */

import { cn } from '@/shared/utils/cn';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Keeps page content aligned and prevents layouts becoming too wide.
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
