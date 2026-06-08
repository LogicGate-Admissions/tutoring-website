/**
 * File purpose: Server-side email notification service for Cloud Functions.
 *
 * This is the Node.js version of the email service. The frontend copy at
 * domains/booking/services/emailNotificationService.ts is browser-safe;
 * this version can use native `fetch` (Node 18+) or a server SDK.
 *
 * CONFIG: set RESEND_API_KEY via firebase functions:config:set resend.api_key="re_xxxx"
 */

// CONFIG: replace with live API key from https://resend.com
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
// CONFIG: replace with your verified From address
const FROM_ADDRESS = 'sessions@yourdomain.com';

type BookingLike = {
  id: string;
  subject: string;
  durationMinutes: number;
  date: { toDate: () => Date };
  meetingLink?: string;
  meetingLinkStatus?: string;
};

export async function sendBookingNotificationEmail(
  booking: BookingLike,
  recipientEmail: string,
  eventType: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[emailNotificationService] RESEND_API_KEY not set — email skipped.');
    return;
  }

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

  const eventLabels: Record<string, string> = {
    booking_request: `New ${booking.subject} session request`,
    booking_accepted: `${booking.subject} session confirmed`,
    booking_declined: `${booking.subject} session request declined`,
    booking_cancelled: `${booking.subject} session cancelled`,
  };

  const emailSubject =
    eventLabels[eventType] ?? `Session update: ${booking.subject}`;

  const meetSection =
    booking.meetingLink && booking.meetingLinkStatus === 'ready'
      ? `
      <p style="margin-top:20px">
        <a href="${booking.meetingLink}"
           style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
          Join Google Meet
        </a>
      </p>
      <p style="margin-top:8px;color:#64748b;font-size:12px;word-break:break-all">
        ${booking.meetingLink}
      </p>`
      : '';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin-bottom:16px">${emailSubject}</h2>
      <p style="color:#475569">
        ${booking.subject} session · ${dateStr} at ${timeStr} · ${booking.durationMinutes} min
      </p>
      ${meetSection}
      <p style="margin-top:24px;color:#94a3b8;font-size:12px">
        Log in to your dashboard to view or manage this session.
      </p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject: emailSubject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}
