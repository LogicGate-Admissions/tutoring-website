'use client';

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useRef } from 'react';

type AuthPromptModalProps = {
  isOpen: boolean;
  reason?: string;
  onClose: () => void;
};

export default function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="relative m-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-8">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
          Create a free account to continue
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign up in under 60 seconds to view full profiles, check availability, and book your first session.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href={ROUTES.studentOnboardingSubjects}
            className="flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Start with Google
          </Link>

          <Link
            href={ROUTES.studentOnboardingSubjects}
            className="flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Start with email
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={ROUTES.studentDashboard}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-950 underline underline-offset-2"
          >
            Already have an account? Continue
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </dialog>
  );
}
