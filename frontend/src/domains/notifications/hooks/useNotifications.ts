'use client';

/**
 * File purpose: build all top-nav notifications for the signed-in user.
 *
 * The bell is intentionally generic. This hook currently produces relationship
 * message notifications, pending match/pre-booking notifications, and booking
 * notifications.
 */

import { useEffect, useRef, useState } from 'react';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import {
  markRelationshipMessagesSeen,
  subscribeToRelationshipSummaries,
} from '@/domains/async-support/services/relationshipsService';
import type { AsyncSupportRole } from '@/domains/async-support/types/asyncSupport';
import {
  markPreBookingMessagesSeen,
  markTrialSessionRequestSeen,
  markTrialSessionStatusSeen,
  subscribeToStudentTrialSessions,
  subscribeToTutorTrialSessions,
} from '@/domains/sessions/trial-sessions/services/trialSessionService';
import type {
  PreBookingMessage,
  TrialSessionRequest,
} from '@/domains/sessions/trial-sessions/types/trialSession';
import type { AppNotification } from '@/domains/notifications/types/notification';
import { useBookingNotifications } from '@/domains/booking/hooks/useBookingNotifications';

type UseNotificationsResult = {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  clearAll: () => Promise<void>;
};

export function useNotifications(
  viewerRole: AsyncSupportRole
): UseNotificationsResult {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [messageNotifications, setMessageNotifications] = useState<
    AppNotification[]
  >([]);
  const [trialNotifications, setTrialNotifications] = useState<
    AppNotification[]
  >([]);
  const unreadRelationshipIdsRef = useRef<string[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingTrials, setIsLoadingTrials] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    notifications: bookingNotifications,
    markAllAsRead: markAllBookingNotificationsRead,
  } = useBookingNotifications(currentUserId, viewerRole);

  useEffect(() => {
    let unsubscribeRelationships: (() => void) | undefined;
    let unsubscribeTrials: (() => void) | undefined;

    const unsubscribeAuth = subscribeToCurrentUser((user) => {
      unsubscribeRelationships?.();
      unsubscribeTrials?.();
      unsubscribeRelationships = undefined;
      unsubscribeTrials = undefined;

      if (!user || user.role !== viewerRole) {
        setCurrentUserId('');
        setMessageNotifications([]);
        setTrialNotifications([]);
        setIsLoadingMessages(false);
        setIsLoadingTrials(false);
        setError(null);
        return;
      }

      setCurrentUserId(user.id);

      setIsLoadingMessages(true);
      setIsLoadingTrials(true);
      setError(null);

      unsubscribeRelationships = subscribeToRelationshipSummaries({
        viewerId: user.id,
        viewerRole,
        onChange: (relationships) => {
          const unread = relationships.filter((r) => r.hasUnreadMessageActivity);
          unreadRelationshipIdsRef.current = unread.map((r) => r.id);
          setMessageNotifications(
            unread.map((relationship) =>
              buildMessageNotification({
                relationshipId: relationship.id,
                viewerRole,
                senderName:
                  relationship.latestMessageSenderName ||
                  (viewerRole === 'student'
                    ? relationship.tutorName
                    : relationship.studentName),
                messagePreview: relationship.latestMessagePreview || '',
                subject: relationship.subject,
                level: relationship.level,
                createdAt: relationship.latestMessageAt || relationship.updatedAt,
                isUrgent: relationship.latestMessageUrgency === 'urgent',
              })
            )
          );
          setIsLoadingMessages(false);
        },
        onError: () => {
          setMessageNotifications([]);
          setIsLoadingMessages(false);
          setError('Could not load message notifications.');
        },
      });

      unsubscribeTrials =
        viewerRole === 'tutor'
          ? subscribeToTutorTrialSessions(user.id, (requests) => {
              setTrialNotifications(buildTutorTrialNotifications(requests));
              setIsLoadingTrials(false);
            })
          : subscribeToStudentTrialSessions(user.id, (requests) => {
              setTrialNotifications(buildStudentTrialNotifications(requests));
              setIsLoadingTrials(false);
            });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRelationships?.();
      unsubscribeTrials?.();
    };
  }, [viewerRole]);

  const notifications = [
    ...messageNotifications,
    ...trialNotifications,
    ...bookingNotifications,
  ].sort((first, second) => second.createdAt.localeCompare(first.createdAt));

  async function clearAll() {
    await Promise.all([
      ...unreadRelationshipIdsRef.current.map((relationshipId) =>
        markRelationshipMessagesSeen({ relationshipId, viewerRole })
      ),
      ...trialNotifications
        .filter((notification) => typeof notification.onOpen === 'function')
        .map((notification) => notification.onOpen!()),
      markAllBookingNotificationsRead(),
    ]);
  }

  return {
    notifications,
    isLoading: isLoadingMessages || isLoadingTrials,
    error,
    clearAll,
  };
}

function buildMessageNotification({
  relationshipId,
  viewerRole,
  senderName,
  messagePreview,
  subject,
  level,
  createdAt,
  isUrgent,
}: {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
  senderName: string;
  messagePreview: string;
  subject: string;
  level: string;
  createdAt: string;
  isUrgent: boolean;
}): AppNotification {
  const dashboardRoot = viewerRole === 'student' ? 'student' : 'tutor';

  return {
    id: `message-${relationshipId}`,
    type: 'message',
    title: isUrgent
      ? `Urgent message from ${senderName || 'Unknown user'}`
      : `New message from ${senderName || 'Unknown user'}`,
    description: isUrgent
      ? messagePreview || 'This student marked a message as urgent.'
      : messagePreview || 'Open the thread to view this message.',
    meta: `${level} ${subject}`.trim(),
    href: `/${dashboardRoot}/dashboard/support/${relationshipId}/messages`,
    createdAt,
    tone: isUrgent ? 'urgent' : 'default',
  };
}

function buildTutorTrialNotifications(requests: TrialSessionRequest[]) {
  return requests
    .filter((request) => request.status === 'pending')
    .flatMap((request) => {
      const unreadMessage = getLatestUnreadPreBookingMessage(request, 'tutor');

      if (unreadMessage) {
        return [
          {
            id: `pre-booking-message-${request.id}`,
            type: 'message' as const,
            title: `New message from ${request.studentName}`,
            description: unreadMessage.body || 'Open Pending students to reply.',
            meta: `${request.level} ${request.subject}`.trim(),
            href: '/tutor/dashboard?section=pending-students',
            createdAt: unreadMessage.createdAt || normaliseNotificationDate(request.updatedAt, request.createdAt),
            onOpen: () => markPreBookingMessagesSeen(request.id, 'tutor'),
          },
        ];
      }

      const createdAt = normaliseNotificationDate(request.createdAt, request.updatedAt);
      const seenAt = normaliseOptionalNotificationDate(request.tutorRequestSeenAt);

      if (seenAt && seenAt >= createdAt) {
        return [];
      }

      return [
        {
          id: `trial-request-${request.id}`,
          type: 'trial-request' as const,
          title: `New pending student: ${request.studentName}`,
          description: request.message || 'A student has requested a match.',
          meta: `${request.level} ${request.subject}`.trim(),
          href: '/tutor/dashboard?section=pending-students',
          createdAt,
          onOpen: () => markTrialSessionRequestSeen(request.id),
        },
      ];
    });
}

function buildStudentTrialNotifications(requests: TrialSessionRequest[]) {
  const pendingMessageNotifications = requests
    .filter((request) => request.status === 'pending')
    .map((request) => {
      const unreadMessage = getLatestUnreadPreBookingMessage(request, 'student');

      if (!unreadMessage) {
        return null;
      }

      return {
        id: `pre-booking-message-${request.id}`,
        type: 'message' as const,
        title: `New message from ${request.tutorName}`,
        description: unreadMessage.body || 'Open Pending tutors to reply.',
        meta: `${request.level} ${request.subject}`.trim(),
        href: '/student/dashboard?section=pending-tutors',
        createdAt: unreadMessage.createdAt || normaliseNotificationDate(request.updatedAt, request.createdAt),
        onOpen: () => markPreBookingMessagesSeen(request.id, 'student'),
      } satisfies AppNotification;
    })
    .filter((notification): notification is AppNotification => Boolean(notification));

  const statusNotifications = requests
    .filter((request) => request.status === 'accepted' || request.status === 'rejected')
    .filter((request) => {
      const updatedAt = normaliseNotificationDate(request.updatedAt, request.createdAt);
      const seenAt = normaliseOptionalNotificationDate(request.studentStatusSeenAt);

      return !seenAt || updatedAt > seenAt;
    })
    .map((request) => ({
      id: `trial-update-${request.id}`,
      type: 'trial-update' as const,
      title:
        request.status === 'accepted'
          ? `${request.tutorName} accepted your trial`
          : `${request.tutorName} rejected your trial`,
      description:
        request.status === 'accepted'
          ? 'You can now open your dashboard to use the support space.'
          : 'You can browse other tutors and request a different trial.',
      meta: `${request.level} ${request.subject}`.trim(),
      href:
        request.status === 'accepted'
          ? '/student/dashboard'
          : '/student/tutors',
      createdAt: normaliseNotificationDate(request.updatedAt, request.createdAt),
      onOpen: () => markTrialSessionStatusSeen(request.id),
    }));

  return [...pendingMessageNotifications, ...statusNotifications];
}

function getLatestUnreadPreBookingMessage(
  request: TrialSessionRequest,
  viewerRole: 'student' | 'tutor'
): PreBookingMessage | null {
  const seenAt = normaliseOptionalNotificationDate(
    viewerRole === 'student'
      ? request.studentPreBookingSeenAt
      : request.tutorPreBookingSeenAt
  );

  const unreadMessages = (request.preBookingMessages ?? []).filter((message) => {
    if (message.senderRole === viewerRole) {
      return false;
    }

    if (!message.createdAt) {
      return true;
    }

    return !seenAt || message.createdAt > seenAt;
  });

  return unreadMessages.length > 0
    ? unreadMessages[unreadMessages.length - 1]
    : null;
}

function normaliseOptionalNotificationDate(value: unknown) {
  if (!value) {
    return undefined;
  }

  return normaliseNotificationDate(value);
}

function normaliseNotificationDate(...values: unknown[]) {
  for (const value of values) {
    if (!value) {
      continue;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const timestampLike = value as { toDate?: () => Date };

      if (typeof timestampLike.toDate === 'function') {
        return timestampLike.toDate().toISOString();
      }
    }
  }

  return new Date().toISOString();
}
