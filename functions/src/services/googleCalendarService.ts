/**
 * Google Calendar integration for confirmed tutoring sessions.
 *
 * Creates a calendar event with a Google Meet link when a booking is confirmed,
 * and deletes the event when a booking is cancelled.
 *
 * ─── SETUP (pick one auth method) ───────────────────────────────────────────
 *
 * Option A — OAuth refresh token (works with personal Gmail; easiest to start):
 *   1. Create a project in Google Cloud Console → enable Google Calendar API.
 *   2. Create OAuth 2.0 credentials (Web application).
 *   3. Use the OAuth Playground or a one-off script to obtain a refresh token
 *      with scope: https://www.googleapis.com/auth/calendar
 *   4. Set Firebase secrets / env vars:
 *        GOOGLE_CLIENT_ID
 *        GOOGLE_CLIENT_SECRET
 *        GOOGLE_REFRESH_TOKEN
 *        GOOGLE_CALENDAR_ID          (default: "primary")
 *        GOOGLE_CALENDAR_TIMEZONE    (default: "Europe/London")
 *
 * Option B — Service account + domain-wide delegation (Google Workspace):
 *   1. Create a service account, download JSON key.
 *   2. In Workspace Admin → Security → API controls → Domain-wide delegation,
 *      grant scope: https://www.googleapis.com/auth/calendar
 *   3. Set env vars:
 *        GOOGLE_SERVICE_ACCOUNT_JSON   (full JSON key as a string)
 *        GOOGLE_CALENDAR_IMPERSONATE_EMAIL  (e.g. sessions@yourdomain.com)
 *        GOOGLE_CALENDAR_ID
 *        GOOGLE_CALENDAR_TIMEZONE
 *
 * Note: Google Meet links require the calendar owner to have Meet enabled.
 * Personal Gmail accounts work with Option A; Workspace is recommended for prod.
 */

import { google, calendar_v3 } from 'googleapis';

export type SessionCalendarInput = {
  bookingId: string;
  subject: string;
  start: Date;
  durationMinutes: number;
  notes?: string;
  tutorEmail: string;
  studentEmail: string;
  tutorName?: string;
  studentName?: string;
};

export type SessionCalendarResult = {
  eventId: string;
  meetingLink: string;
};

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

function getTimezone(): string {
  return process.env.GOOGLE_CALENDAR_TIMEZONE ?? 'Europe/London';
}

function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID ?? 'primary';
}

function isCalendarConfigured(): boolean {
  const hasOAuth =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
    Boolean(process.env.GOOGLE_REFRESH_TOKEN);

  const hasServiceAccount =
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) &&
    Boolean(process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL);

  return hasOAuth || hasServiceAccount;
}

function getCalendarClient(): calendar_v3.Calendar | null {
  if (!isCalendarConfigured()) return null;

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson) as {
      client_email: string;
      private_key: string;
    };
    const impersonateEmail = process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL;
    if (!impersonateEmail) return null;

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [CALENDAR_SCOPE],
      subject: impersonateEmail,
    });

    return google.calendar({ version: 'v3', auth });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

function extractMeetLink(event: calendar_v3.Schema$Event): string | null {
  return event.hangoutLink ?? event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === 'video'
  )?.uri ?? null;
}

function buildEventBody(input: SessionCalendarInput): calendar_v3.Schema$Event {
  const end = new Date(input.start.getTime() + input.durationMinutes * 60_000);
  const timezone = getTimezone();
  const tutorLabel = input.tutorName ?? 'Tutor';
  const studentLabel = input.studentName ?? 'Student';

  const descriptionParts = [
    `Tutoring session: ${input.subject}`,
    `Tutor: ${tutorLabel}`,
    `Student: ${studentLabel}`,
  ];
  if (input.notes) descriptionParts.push('', `Notes: ${input.notes}`);

  return {
    summary: `${input.subject} — ${tutorLabel} & ${studentLabel}`,
    description: descriptionParts.join('\n'),
    start: {
      dateTime: input.start.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: timezone,
    },
    attendees: [
      { email: input.tutorEmail },
      { email: input.studentEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: `booking-${input.bookingId}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };
}

/**
 * Create a Google Calendar event with a Meet link for a confirmed session.
 * Returns null when Calendar API is not configured (graceful skip).
 */
export async function createSessionCalendarEvent(
  input: SessionCalendarInput
): Promise<SessionCalendarResult | null> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.warn(
      '[googleCalendarService] Google Calendar not configured — skipping Meet link creation.'
    );
    return null;
  }

  const response = await calendar.events.insert({
    calendarId: getCalendarId(),
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: buildEventBody(input),
  });

  const eventId = response.data.id;
  const meetingLink = response.data ? extractMeetLink(response.data) : null;

  if (!eventId || !meetingLink) {
    throw new Error('Calendar event created but no event ID or Meet link was returned.');
  }

  return { eventId, meetingLink };
}

/**
 * Delete a calendar event when a session is cancelled.
 * No-op when Calendar API is not configured or eventId is missing.
 */
export async function deleteSessionCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  if (!calendar) return;

  try {
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId,
      sendUpdates: 'all',
    });
  } catch (error) {
    // Event may already be deleted manually — log and continue.
    console.warn(`[googleCalendarService] Could not delete event ${eventId}:`, error);
  }
}

export { isCalendarConfigured };
