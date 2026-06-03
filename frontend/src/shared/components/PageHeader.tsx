/**
 * File purpose: Reusable UI component shared across domains. Keep it generic and product-agnostic.
 */

import { Container } from '@/shared/components/Container';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

/**
 * Reusable page heading used across student and tutor routes.
 */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200 bg-[#f8f7f4] py-12">
      <Container>
        {eyebrow && (
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
