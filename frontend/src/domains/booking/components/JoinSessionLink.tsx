'use client';

/**
 * Join button / status for a confirmed session's Google Meet link.
 */

import type { BookingRequest } from '@/domains/booking/types/booking';
import { cn } from '@/shared/utils/cn';

type JoinSessionLinkProps = {
  booking: BookingRequest;
  /** Compact style for calendar blocks. */
  variant?: 'default' | 'compact';
  className?: string;
};

export function JoinSessionLink({
  booking,
  variant = 'default',
  className,
}: JoinSessionLinkProps) {
  if (booking.status !== 'confirmed') return null;

  const { meetingLink, meetingLinkStatus } = booking;
  const linkReady = Boolean(meetingLink) && meetingLinkStatus !== 'failed';

  if (linkReady && meetingLink) {
    if (variant === 'compact') {
      return (
        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'mt-0.5 inline-block truncate text-[0.55rem] font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200',
            className
          )}
        >
          Join Meet →
        </a>
      );
    }

    return (
      <div className={cn('mt-3', className)}>
        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition',
            'hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2'
          )}
        >
          <MeetIcon />
          Join Google Meet
        </a>
        <p className="mt-1.5 truncate text-[0.65rem] text-slate-400">{meetingLink}</p>
      </div>
    );
  }

  if (meetingLinkStatus === 'pending' || !meetingLinkStatus) {
    const message = 'Setting up meeting link…';
    if (variant === 'compact') {
      return (
        <p className={cn('mt-0.5 truncate text-[0.55rem] text-slate-400', className)}>
          {message}
        </p>
      );
    }
    return (
      <p className={cn('mt-3 text-xs text-slate-500', className)}>{message}</p>
    );
  }

  if (meetingLinkStatus === 'failed') {
    const message = 'Could not create meeting link. Try refreshing the page.';
    if (variant === 'compact') {
      return (
        <p className={cn('mt-0.5 truncate text-[0.55rem] text-amber-400', className)}>
          Link unavailable
        </p>
      );
    }
    return (
      <p className={cn('mt-3 text-xs text-amber-600', className)}>{message}</p>
    );
  }

  if (meetingLinkStatus === 'skipped') {
    const message =
      'Google Calendar is not configured yet — ask your admin to enable Meet links.';
    if (variant === 'compact') return null;
    return (
      <p className={cn('mt-3 text-xs text-slate-500', className)}>{message}</p>
    );
  }

  return null;
}

function MeetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M6 9c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V9zm10.5 1.5L19 8v8l-2.5-2.5V10.5z" />
    </svg>
  );
}
