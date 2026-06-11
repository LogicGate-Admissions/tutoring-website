/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'LogicGate',
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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Script id="logicgate-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('logicgate-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}`}
        </Script>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
