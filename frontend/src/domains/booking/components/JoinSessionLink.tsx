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
  label?: string;
};

export function JoinSessionLink({
  booking,
  variant = 'default',
  className,
  label = 'Join Google Meet',
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
          {label} →
        </a>
      );
    }

    return (
      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-950 transition',
          'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
          className
        )}
      >
        {label}
      </a>
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

