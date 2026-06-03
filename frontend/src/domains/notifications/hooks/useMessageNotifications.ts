'use client';

/**
 * File purpose:
 * Build message notifications for the signed-in user from relationship
 * activity metadata.
 *
 * We subscribe to relationship summaries rather than every messages
 * subcollection. When a message is sent, the message service updates latest
 * message fields on the relationship document, which makes the bell update.
 */

import { useEffect, useState } from 'react';
import { subscribeToCurrentUser } from '@/domains/auth/services/authService';
import { subscribeToRelationshipSummaries } from '@/domains/async-support/services/relationshipsService';
import type { AsyncSupportRole } from '@/domains/async-support/types/asyncSupport';
import type { AppNotification } from '@/domains/notifications/types/notification';

type UseMessageNotificationsResult = {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
};

export function useMessageNotifications(
  viewerRole: AsyncSupportRole
): UseMessageNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeRelationships: (() => void) | undefined;

    const unsubscribeAuth = subscribeToCurrentUser((user) => {
      unsubscribeRelationships?.();
      unsubscribeRelationships = undefined;

      if (!user || user.role !== viewerRole) {
        setNotifications([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      unsubscribeRelationships = subscribeToRelationshipSummaries({
        viewerId: user.id,
        viewerRole,
        onChange: (relationships) => {
          setNotifications(
            relationships
              .filter((relationship) => relationship.hasUnreadMessageActivity)
              .map((relationship) =>
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
                })
              )
          );
          setIsLoading(false);
          setError(null);
        },
        onError: () => {
          setNotifications([]);
          setIsLoading(false);
          setError('Could not load notifications.');
        },
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRelationships?.();
    };
  }, [viewerRole]);

  return {
    notifications,
    isLoading,
    error,
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
}: {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
  senderName: string;
  messagePreview: string;
  subject: string;
  level: string;
  createdAt: string;
}): AppNotification {
  const dashboardRoot = viewerRole === 'student' ? 'student' : 'tutor';

  return {
    id: `message-${relationshipId}`,
    type: 'message',
    title: `New message from ${senderName || 'Unknown user'}`,
    description: messagePreview || 'Open the thread to view this message.',
    meta: `${level} ${subject}`.trim(),
    href: `/${dashboardRoot}/dashboard/support/${relationshipId}/messages`,
    createdAt,
  };
}
