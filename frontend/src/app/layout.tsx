/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tutorly',
  description:
    'A clearer way for students and tutors to prepare, communicate, and share learning support.',
};

/**
 * Root layout for the whole app.
 *
 * It avoids external web fonts so local builds and CI do not depend on Google
 * Fonts being reachable during the production build.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
