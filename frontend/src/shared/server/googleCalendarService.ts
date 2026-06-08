/**
 * Google Calendar + Meet link creation (server-only).
 *
 * CONFIG — set in .env.local (see functions/src/services/googleCalendarService.ts):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   — or —
 *   GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CALENDAR_IMPERSONATE_EMAIL
 */

import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';

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

export function isCalendarConfigured(): boolean {
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
  return (
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((entry: calendar_v3.Schema$EntryPoint) => entry.entryPointType === 'video')?.uri ??
    null
  );
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
    start: { dateTime: input.start.toISOString(), timeZone: timezone },
    end: { dateTime: end.toISOString(), timeZone: timezone },
    attendees: [{ email: input.tutorEmail }, { email: input.studentEmail }],
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

export async function createSessionCalendarEvent(
  input: SessionCalendarInput
): Promise<SessionCalendarResult | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;

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
