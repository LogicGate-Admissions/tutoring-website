/**
 * File purpose: app-level notification types.
 *
 * The bell uses one generic notification shape. This iteration shows message
 * and trial-request notifications, but the same type can later support flagged
 * questions, resources, homework, or payment events.
 */

export type AppNotificationType =
  | 'message'
  | 'trial-request'
  | 'trial-update'
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'reschedule_proposed'
  | 'reschedule_declined';

export type AppNotificationTone = 'default' | 'urgent';

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  description: string;
  meta: string;
  photoUrl?: string;
  href: string;
  createdAt: string;
  tone?: AppNotificationTone;
  onOpen?: () => void | Promise<void>;
};
