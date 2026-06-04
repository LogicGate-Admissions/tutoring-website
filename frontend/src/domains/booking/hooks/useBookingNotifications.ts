'use client';

/**
 * File purpose: Real-time subscription to Firestore-persisted booking notifications.
 *
 * Converts BookingNotification documents into the shared AppNotification shape
 * so they can be merged into the existing notification bell without changes
 * to NotificationBell's component API.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants/firestoreCollections';
import type { BookingNotification } from '@/domains/booking/types/bookingNotification';
import type { AppNotification } from '@/domains/notifications/types/notification';

function castNotification(id: string, data: Record<string, unknown>): BookingNotification {
  return {
    id,
    userId: data.userId as string,
    type: data.type as BookingNotification['type'],
    bookingId: data.bookingId as string,
    message: data.message as string,
    read: Boolean(data.read),
    createdAt: data.createdAt as Timestamp,
  };
}

function toAppNotification(
  n: BookingNotification,
  viewerRole: 'tutor' | 'student',
  onMarkRead: (id: string) => Promise<void>
): AppNotification {
  const dashboardRoot = viewerRole === 'student' ? 'student' : 'tutor';

  return {
    id: `booking-${n.id}`,
    type: 'booking_request',
    title: n.message,
    description: 'Tap to view your sessions.',
    meta: 'Session booking',
    href: `/${dashboardRoot}/dashboard`,
    createdAt: n.createdAt.toDate().toISOString(),
    onOpen: () => onMarkRead(n.id),
  };
}

type UseBookingNotificationsResult = {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function useBookingNotifications(
  userId: string,
  viewerRole: 'tutor' | 'student'
): UseBookingNotificationsResult {
  const [rawNotifications, setRawNotifications] = useState<BookingNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRawNotifications([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.bookingNotifications),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sorted = snapshot.docs
          .map((d) => castNotification(d.id, d.data()))
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setRawNotifications(sorted);
        setIsLoading(false);
        setError(null);
      },
      () => {
        setRawNotifications([]);
        setIsLoading(false);
        setError('Could not load booking notifications.');
      }
    );

    return unsubscribe;
  }, [userId]);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    await updateDoc(
      doc(db, FIRESTORE_COLLECTIONS.bookingNotifications, id),
      { read: true }
    );
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    const unread = rawNotifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    for (const n of unread) {
      batch.update(
        doc(db, FIRESTORE_COLLECTIONS.bookingNotifications, n.id),
        { read: true }
      );
    }
    await batch.commit();
  }, [rawNotifications]);

  const unread = rawNotifications.filter((n) => !n.read);
  const unreadCount = unread.length;

  const notifications = unread
    .slice(0, 10)
    .map((n) => toAppNotification(n, viewerRole, markAsRead));

  return { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error };
}
