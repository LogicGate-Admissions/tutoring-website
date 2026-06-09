/**
 * File purpose: Firestore-persisted booking notification document shape.
 *
 * These are written to the `bookingNotifications` collection by
 * bookingService on every status transition. The useBookingNotifications hook
 * subscribes to them in real time and exposes markAsRead / markAllAsRead.
 */

import type { Timestamp } from 'firebase/firestore';

export type BookingNotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_rescheduled';

export type BookingNotification = {
  id: string;
  userId: string;           // recipient - indexed for per-user queries
  type: BookingNotificationType;
  bookingId: string;
  message: string;          // e.g. "Alex requested a Maths session on Tue 10 Jun"
  read: boolean;
  createdAt: Timestamp;
};
