/**
 * File purpose: app-level notification types.
 *
 * The first notification type is message activity, but this shape is designed
 * to support later activity such as flagged questions, resources, trial
 * requests, and homework without changing the notification bell UI.
 */

export type AppNotificationType = 'message';

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  description: string;
  meta: string;
  href: string;
  createdAt: string;
};
