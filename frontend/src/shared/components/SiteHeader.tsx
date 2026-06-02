import Link from 'next/link';
import { Container } from '@/shared/components/Container';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Shared top navigation header used by student and tutor route layouts.
 */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-[#f8f7f4]/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center">
        <Link href={ROUTES.home} className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">
            TM
          </div>
          <span className="text-base font-semibold tracking-[-0.02em] text-slate-950">
            LogicGate
          </span>
        </Link>
      </Container>
    </header>
  );
}
