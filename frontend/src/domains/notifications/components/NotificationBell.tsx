'use client';

/**
 * File purpose:
 * Notification bell for authenticated dashboards and support pages.
 *
 * This iteration shows message and trial-request notifications. The component
 * uses a generic notification shape so later we can add flagged-question,
 * resource, homework, or calendar notifications without replacing the bell UI.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/domains/notifications/hooks/useNotifications';
import type { AsyncSupportRole } from '@/domains/async-support/types/asyncSupport';
import type { AppNotification } from '@/domains/notifications/types/notification';
import { cn } from '@/shared/utils/cn';

type NotificationBellProps = {
  userType: AsyncSupportRole;
};

export function NotificationBell({ userType }: NotificationBellProps) {
  const { notifications, isLoading, error, clearAll } = useNotifications(userType);
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label="Open notifications"
        className={cn(
          'relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition',
          'hover:border-slate-950 hover:bg-slate-50 hover:text-slate-950',
          'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2'
        )}
      >
        <BellIcon />

        {notifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[0.68rem] font-bold leading-none text-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Notifications</p>
              {notifications.length > 0 && (
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => {
                    setIsClearing(true);
                    void clearAll().finally(() => {
                      setIsClearing(false);
                      setIsOpen(false);
                    });
                  }}
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-950 disabled:opacity-50"
                >
                  {isClearing ? 'Clearing…' : 'Clear all'}
                </button>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Messages, match requests, and support activity.
            </p>
          </div>

          <NotificationBellContent
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            onNotificationClick={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

function NotificationBellContent({
  notifications,
  isLoading,
  error,
  onNotificationClick,
}: {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  onNotificationClick: () => void;
}) {
  const router = useRouter();

  if (isLoading) {
    return <NotificationStateMessage message="Loading notifications..." />;
  }

  if (error) {
    return <NotificationStateMessage message={error} />;
  }

  if (notifications.length === 0) {
    return <NotificationStateMessage message="No new notifications." />;
  }

  return (
    <div className="max-h-96 overflow-y-auto p-2">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => {
            void (async () => {
              await notification.onOpen?.();
              onNotificationClick();
              router.push(notification.href);
            })();
          }}
          className={cn(
            'block w-full rounded-2xl px-3 py-3 text-left transition',
            notification.tone === 'urgent'
              ? 'bg-red-50 hover:bg-red-100'
              : 'hover:bg-slate-50'
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full',
                notification.tone === 'urgent' ? 'bg-red-600' : 'bg-slate-950'
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">
                {notification.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                {notification.description}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {notification.meta} · {formatNotificationTime(notification.createdAt)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function NotificationStateMessage({ message }: { message: string }) {
  return <p className="px-4 py-6 text-sm text-slate-600">{message}</p>;
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function formatNotificationTime(value: string) {
  if (!value) {
    return 'just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
