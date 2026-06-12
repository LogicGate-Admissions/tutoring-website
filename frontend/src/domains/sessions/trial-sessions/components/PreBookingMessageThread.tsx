'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';
import type { PreBookingMessage } from '@/domains/sessions/trial-sessions/types/trialSession';

type PreBookingMessageThreadProps = {
  messages: PreBookingMessage[];
  currentUserId?: string;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  helperText?: string;
  onSend: (body: string) => Promise<void> | void;
};

/**
 * Text-only message thread used before a student/tutor match is accepted.
 *
 * The composer deliberately avoids maths, urgency, and attachments. The visual
 * message bubbles mirror the booked message thread so the conversation feels
 * continuous when it later moves into My Tutors/My Students.
 */
export function PreBookingMessageThread({
  messages,
  currentUserId,
  disabled = false,
  placeholder = 'Ask a clarifying question...',
  emptyText = 'No messages yet.',
  helperText = 'Text-only questions before the first booked session. Attachments, urgent flags, and maths tools unlock after the tutor accepts.',
  onSend,
}: PreBookingMessageThreadProps) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sortedMessages = [...messages].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  const canSend = draft.trim().length > 0 && !disabled && !isSending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDraft = draft.trim();
    if (!trimmedDraft || disabled) return;

    setIsSending(true);
    try {
      await onSend(trimmedDraft);
      setDraft('');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Messages</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {helperText}
          </p>
        </div>
      </div>

      <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl bg-slate-50 p-3">
        {sortedMessages.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          <div className="grid gap-3">
            {sortedMessages.map((message) => (
              <PreBookingMessageBubble
                key={message.id}
                message={message}
                isMine={message.senderId === currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          maxLength={1000}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{draft.trim().length}/1000 characters</p>
          <Button type="submit" disabled={!canSend}>
            {isSending ? 'Sending...' : 'Send message'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PreBookingMessageBubble({
  message,
  isMine,
}: {
  message: PreBookingMessage;
  isMine: boolean;
}) {
  return (
    <div className={cn('flex min-w-0', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'min-w-0 max-w-[min(42rem,85%)] rounded-3xl px-4 py-3 text-sm',
          isMine ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-xs font-semibold',
              isMine ? 'text-slate-200' : 'text-slate-600'
            )}
          >
            {isMine ? 'You' : message.senderName || 'Unknown user'}
          </span>

          {message.createdAt ? (
            <span className={cn('text-xs', isMine ? 'text-slate-400' : 'text-slate-500')}>
              {formatMessageTime(message.createdAt)}
            </span>
          ) : null}
        </div>

        <p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p>
      </div>
    </div>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
