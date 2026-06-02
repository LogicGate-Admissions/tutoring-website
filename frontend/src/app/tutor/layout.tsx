import { ReactNode } from 'react';
import { SiteHeader } from '@/shared/components/SiteHeader';

export default function TutorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">{children}</main>
    </>
  );
}
