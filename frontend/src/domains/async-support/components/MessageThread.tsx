'use client';

/**
 * File purpose:
 * Shared message thread for student and tutor support routes.
 *
 * The thread now supports live updates and an unread divider. Opening the
 * thread marks messages as seen for the current viewer, which clears the top
 * navigation notification bell.
 */

import { FormEvent, useEffect, useState } from 'react';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import {
  createSupportMessage,
  subscribeToSupportMessages,
} from '@/domains/async-support/services/messagesService';
import {
  getStudentTutorRelationshipById,
  markRelationshipMessagesSeen,
} from '@/domains/async-support/services/relationshipsService';
import type {
  AsyncSupportRole,
  StudentTutorRelationship,
  SupportMessage,
} from '@/domains/async-support/types/asyncSupport';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';

type MessageThreadProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
};

type CurrentThreadUser = {
  id: string;
  name: string;
  role: AsyncSupportRole;
};

export function MessageThread({
  relationshipId,
  viewerRole,
}: MessageThreadProps) {
  const [currentUser, setCurrentUser] = useState<CurrentThreadUser | null>(null);
  const [relationship, setRelationship] =
    useState<StudentTutorRelationship | null>(null);
  const [previousLastSeenMessagesAt, setPreviousLastSeenMessagesAt] =
    useState<string | undefined>();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCurrentUser((user) => {
      if (!user || user.role !== viewerRole) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser({
        id: user.id,
        name: user.name,
        role: user.role,
      });
    });

    return unsubscribe;
  }, [viewerRole]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let isActive = true;
    let unsubscribeMessages: (() => void) | undefined;

    async function initialiseThread() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedRelationship =
          await getStudentTutorRelationshipById(relationshipId);

        if (!isActive) {
          return;
        }

        setRelationship(loadedRelationship);
        setPreviousLastSeenMessagesAt(
          getViewerLastSeenMessagesAt(loadedRelationship, viewerRole)
        );

        unsubscribeMessages = subscribeToSupportMessages({
          relationshipId,
          onChange: (loadedMessages) => {
            if (!isActive) {
              return;
            }

            setMessages(loadedMessages);
            setIsLoading(false);
            setError(null);

            markRelationshipMessagesSeen({
              relationshipId,
              viewerRole,
            }).catch(() => {
              // The thread can still be read if this metadata update fails.
              // A later refresh/open will attempt to mark messages as seen again.
            });
          },
          onError: () => {
            if (!isActive) {
              return;
            }

            setMessages([]);
            setIsLoading(false);
            setError('Could not load messages.');
          },
        });
      } catch {
        if (!isActive) {
          return;
        }

        setMessages([]);
        setIsLoading(false);
        setError('Could not load messages.');
      }
    }

    initialiseThread();

    return () => {
      isActive = false;
      unsubscribeMessages?.();
    };
  }, [currentUser, relationshipId, viewerRole]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = draftMessage.trim();

    if (!currentUser || !trimmedMessage) {
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      await createSupportMessage({
        relationshipId,
        senderId: currentUser.id,
        senderRole: currentUser.role,
        senderName: currentUser.name,
        body: trimmedMessage,
      });

      setDraftMessage('');
    } catch {
      setError('Could not send message.');
    } finally {
      setIsSending(false);
    }
  }

  const firstUnreadMessageId = getFirstUnreadMessageId({
    messages,
    currentUserId: currentUser?.id,
    previousLastSeenMessagesAt,
  });

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Message thread
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use this space for async support between sessions. New messages appear
          automatically, and unread messages are marked when you open the thread.
        </p>

        {relationship ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Conversation with:</span>{' '}
              {viewerRole === 'student'
                ? relationship.tutorName
                : relationship.studentName}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Subject:</span>{' '}
              {relationship.level} {relationship.subject}
            </p>
          </div>
        ) : null}
      </Card>

      <Card className="grid gap-4">
        {isLoading ? (
          <p className="text-sm text-slate-600">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">
              No messages yet
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Send the first message to start this async support thread.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => (
              <div key={message.id} className="grid gap-3">
                {message.id === firstUnreadMessageId ? <UnreadDivider /> : null}
                <MessageBubble
                  message={message}
                  isMine={message.senderId === currentUser?.id}
                />
              </div>
            ))}
          </div>
        )}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleSendMessage}
          className="grid gap-3 border-t border-slate-200 pt-4"
        >
          <label
            htmlFor="support-message"
            className="text-sm font-semibold text-slate-800"
          >
            New message
          </label>

          <textarea
            id="support-message"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Write a message..."
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {draftMessage.trim().length}/2000 characters
            </p>

            <Button
              type="submit"
              disabled={!currentUser || !draftMessage.trim() || isSending}
            >
              {isSending ? 'Sending...' : 'Send message'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: SupportMessage;
  isMine: boolean;
}) {
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[min(42rem,85%)] rounded-3xl px-4 py-3',
          isMine
            ? 'bg-slate-950 text-white'
            : 'bg-slate-100 text-slate-900'
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-xs font-semibold',
              isMine ? 'text-slate-200' : 'text-slate-600'
            )}
          >
            {isMine ? 'You' : message.senderName || 'Unknown user'}
          </span>

          <span
            className={cn(
              'text-xs',
              isMine ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {formatMessageTime(message.createdAt)}
          </span>
        </div>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
          {message.body}
        </p>
      </div>
    </div>
  );
}

function UnreadDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
        Unread messages
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function getViewerLastSeenMessagesAt(
  relationship: StudentTutorRelationship | null,
  viewerRole: AsyncSupportRole
) {
  if (!relationship) {
    return undefined;
  }

  return viewerRole === 'student'
    ? relationship.studentLastSeenMessagesAt
    : relationship.tutorLastSeenMessagesAt;
}

function getFirstUnreadMessageId({
  messages,
  currentUserId,
  previousLastSeenMessagesAt,
}: {
  messages: SupportMessage[];
  currentUserId?: string;
  previousLastSeenMessagesAt?: string;
}) {
  if (!currentUserId) {
    return undefined;
  }

  const firstUnreadMessage = messages.find((message) => {
    if (message.senderId === currentUserId) {
      return false;
    }

    if (!previousLastSeenMessagesAt) {
      return true;
    }

    return message.createdAt > previousLastSeenMessagesAt;
  });

  return firstUnreadMessage?.id;
}

function formatMessageTime(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
