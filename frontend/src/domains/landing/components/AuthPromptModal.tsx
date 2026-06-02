'use client';

import Link from 'next/link';
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
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto max-w-sm w-full rounded-[1.75rem] border-2 border-slate-950 bg-white p-0 shadow-[12px_12px_0_#0f172a] backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-8">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-950 bg-brand-accent text-2xl shadow-[3px_3px_0_#0f172a]">
          ✨
        </div>

        <h2 className="font-serif text-center text-2xl font-bold text-slate-950" style={{ letterSpacing: '-0.02em' }}>
          Create a free account to continue
        </h2>

        <p className="mt-3 text-center text-sm font-medium leading-6 text-slate-600">
          Sign up in under 60 seconds to view full profiles, check availability, and book your first session.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/signup?method=google&role=student"
            className="flex items-center justify-center gap-3 rounded-xl border-2 border-slate-950 bg-white px-5 py-3.5 text-sm font-bold shadow-[3px_3px_0_#0f172a] transition hover:bg-slate-50 hover:shadow-[4px_4px_0_#0f172a] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_#0f172a]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </Link>

          <Link
            href="/signup?role=student"
            className="flex items-center justify-center rounded-xl border-2 border-slate-950 bg-brand-accent px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[3px_3px_0_#0f172a] transition hover:brightness-105 hover:shadow-[4px_4px_0_#0f172a] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_#0f172a]"
          >
            Sign up with email
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-950 underline underline-offset-2"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-sm font-black text-slate-500 transition hover:border-slate-950 hover:text-slate-950"
      >
        ×
      </button>
    </dialog>
  );
}
