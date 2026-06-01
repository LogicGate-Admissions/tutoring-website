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
 * In Next.js, layout.tsx wraps every page inside the folder it belongs to.
 * This root layout wraps the entire application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
