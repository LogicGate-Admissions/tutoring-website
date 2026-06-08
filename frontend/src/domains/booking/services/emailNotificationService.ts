/**
 * File purpose: Email notification stub for booking status changes.
 *
 * Replace the CONFIG comments below with a live Resend or SendGrid API key
 * and the correct From address before deploying to production.
 *
 * This service is also called from the Cloud Function onBookingWrite.ts, so
 * keep it free of browser-only APIs.
 */

import type { BookingRequest } from '@/domains/booking/types/booking';

// CONFIG: replace with live API key from https://resend.com or SendGrid
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
// CONFIG: replace with your verified From address
const FROM_ADDRESS = 'sessions@yourdomain.com';

type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[emailNotificationService] RESEND_API_KEY not set — email skipped.');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}

function buildEmailContent(
  booking: BookingRequest,
  eventType: string
): { subject: string; html: string } {
  const dateStr = booking.date.toDate().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = booking.date.toDate().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const eventMessages: Record<string, { subject: string; body: string }> = {
    booking_request: {
      subject: `New ${booking.subject} session request`,
      body: `You have a new session request for <strong>${booking.subject}</strong> on ${dateStr} at ${timeStr} (${booking.durationMinutes} min).`,
    },
    booking_accepted: {
      subject: `${booking.subject} session confirmed`,
      body: `Your <strong>${booking.subject}</strong> session on ${dateStr} at ${timeStr} has been confirmed.`,
    },
    booking_declined: {
      subject: `${booking.subject} session request declined`,
      body: `Your session request for <strong>${booking.subject}</strong> on ${dateStr} was declined.`,
    },
    booking_cancelled: {
      subject: `${booking.subject} session cancelled`,
      body: `Your <strong>${booking.subject}</strong> session on ${dateStr} at ${timeStr} has been cancelled.`,
    },
  };

  const content = eventMessages[eventType] ?? {
    subject: `Session update: ${booking.subject}`,
    body: `There has been an update to your <strong>${booking.subject}</strong> session on ${dateStr}.`,
  };

  const lessonSection = '';


  return {
    subject: content.subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a;margin-bottom:16px">${content.subject}</h2>
        <p style="color:#475569">${content.body}</p>
        ${lessonSection}
        <p style="margin-top:24px;color:#94a3b8;font-size:12px">
          Log in to your dashboard to view or manage this session.
        </p>
      </div>
    `,
  };
}

/**
 * Send a transactional email for a booking status change.
 *
 * @param booking - The full BookingRequest document after the status change.
 * @param recipientEmail - The recipient's email address.
 * @param eventType - One of the BookingNotificationType values.
 */
export async function sendBookingNotificationEmail(
  booking: BookingRequest,
  recipientEmail: string,
  eventType: string
): Promise<void> {
  const { subject, html } = buildEmailContent(booking, eventType);

  await sendEmail({
    from: FROM_ADDRESS,
    to: recipientEmail,
    subject,
    html,
  });
}
