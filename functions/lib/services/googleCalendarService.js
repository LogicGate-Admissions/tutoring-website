"use strict";
/**
 * Google Calendar integration for confirmed tutoring sessions.
 *
 * Meet links are OPEN spaces (Meet API) attached to calendar events as plain
 * links — not calendar-embedded conferences that require the API owner to
 * admit participants.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionCalendarEvent = createSessionCalendarEvent;
exports.deleteSessionCalendarEvent = deleteSessionCalendarEvent;
exports.isCalendarConfigured = isCalendarConfigured;
const googleapis_1 = require("googleapis");
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const MEET_CREATED_SCOPE = 'https://www.googleapis.com/auth/meetings.space.created';
const MEET_SETTINGS_SCOPE = 'https://www.googleapis.com/auth/meetings.space.settings';
const GOOGLE_SCOPES = [CALENDAR_SCOPE, MEET_CREATED_SCOPE, MEET_SETTINGS_SCOPE];
function getTimezone() {
    return process.env.GOOGLE_CALENDAR_TIMEZONE ?? 'Europe/London';
}
function getCalendarId() {
    return process.env.GOOGLE_CALENDAR_ID ?? 'primary';
}
function isCalendarConfigured() {
    const hasOAuth = Boolean(process.env.GOOGLE_CLIENT_ID) &&
        Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
        Boolean(process.env.GOOGLE_REFRESH_TOKEN);
    const hasServiceAccount = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) &&
        Boolean(process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL);
    return hasOAuth || hasServiceAccount;
}
function getGoogleAuth() {
    if (!isCalendarConfigured())
        return null;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
        const credentials = JSON.parse(serviceAccountJson);
        const impersonateEmail = process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL;
        if (!impersonateEmail)
            return null;
        return new googleapis_1.google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: GOOGLE_SCOPES,
            subject: impersonateEmail,
        });
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken)
        return null;
    const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
}
function getCalendarClient() {
    const auth = getGoogleAuth();
    if (!auth)
        return null;
    return googleapis_1.google.calendar({ version: 'v3', auth });
}
function meetingCodeFromMeetLink(meetingLink) {
    try {
        const code = new URL(meetingLink).pathname.replace(/^\//, '').trim();
        return code || null;
    }
    catch {
        return null;
    }
}
function extractMeetLink(event) {
    return event.hangoutLink ?? event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri ?? null;
}
async function openMeetSpaceAccess(meetingLink) {
    const auth = getGoogleAuth();
    if (!auth)
        return;
    const meetingCode = meetingCodeFromMeetLink(meetingLink);
    if (!meetingCode)
        return;
    const meet = googleapis_1.google.meet({ version: 'v2', auth });
    const spaceResponse = await meet.spaces.get({ name: `spaces/${meetingCode}` });
    const spaceName = spaceResponse.data.name;
    if (!spaceName)
        return;
    await meet.spaces.patch({
        name: spaceName,
        updateMask: 'config.accessType,config.entryPointAccess',
        requestBody: {
            config: {
                accessType: 'OPEN',
                entryPointAccess: 'ALL',
            },
        },
    });
}
async function createOpenMeetSpace() {
    const auth = getGoogleAuth();
    if (!auth)
        return null;
    try {
        const meet = googleapis_1.google.meet({ version: 'v2', auth });
        const response = await meet.spaces.create({
            requestBody: {
                config: {
                    accessType: 'OPEN',
                    entryPointAccess: 'ALL',
                },
            },
        });
        return response.data.meetingUri ?? null;
    }
    catch (error) {
        console.warn('[googleCalendarService] spaces.create failed:', error);
        return null;
    }
}
async function createMeetLinkViaTempCalendarEvent(bookingId) {
    const calendar = getCalendarClient();
    if (!calendar)
        return null;
    const timezone = getTimezone();
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60_000);
    try {
        const response = await calendar.events.insert({
            calendarId: getCalendarId(),
            conferenceDataVersion: 1,
            requestBody: {
                summary: 'Meet link provisioning',
                start: { dateTime: start.toISOString(), timeZone: timezone },
                end: { dateTime: end.toISOString(), timeZone: timezone },
                conferenceData: {
                    createRequest: {
                        requestId: `temp-${bookingId}-${Date.now()}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            },
        });
        const meetingLink = response.data ? extractMeetLink(response.data) : null;
        const tempEventId = response.data.id;
        if (tempEventId) {
            await calendar.events.delete({
                calendarId: getCalendarId(),
                eventId: tempEventId,
            });
        }
        if (meetingLink) {
            try {
                await openMeetSpaceAccess(meetingLink);
            }
            catch (error) {
                console.warn('[googleCalendarService] Could not patch Meet to OPEN:', error);
            }
        }
        return meetingLink;
    }
    catch (error) {
        console.warn('[googleCalendarService] Temp calendar Meet creation failed:', error);
        return null;
    }
}
async function resolveOpenMeetLink(bookingId) {
    const fromMeetApi = await createOpenMeetSpace();
    if (fromMeetApi)
        return fromMeetApi;
    const fromCalendar = await createMeetLinkViaTempCalendarEvent(bookingId);
    if (fromCalendar)
        return fromCalendar;
    throw new Error('Could not create an open Google Meet link.');
}
function buildEventBody(input, meetingLink) {
    const end = new Date(input.start.getTime() + input.durationMinutes * 60_000);
    const timezone = getTimezone();
    const tutorLabel = input.tutorName ?? 'Tutor';
    const studentLabel = input.studentName ?? 'Student';
    const descriptionParts = [
        `Tutoring session: ${input.subject}`,
        `Tutor: ${tutorLabel}`,
        `Student: ${studentLabel}`,
        '',
        `Join Google Meet: ${meetingLink}`,
    ];
    if (input.notes)
        descriptionParts.push('', `Notes: ${input.notes}`);
    return {
        summary: `${input.subject} — ${tutorLabel} & ${studentLabel}`,
        description: descriptionParts.join('\n'),
        location: meetingLink,
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
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 15 },
            ],
        },
    };
}
async function createSessionCalendarEvent(input) {
    const calendar = getCalendarClient();
    if (!calendar) {
        console.warn('[googleCalendarService] Google Calendar not configured — skipping Meet link creation.');
        return null;
    }
    const meetingLink = await resolveOpenMeetLink(input.bookingId);
    const response = await calendar.events.insert({
        calendarId: getCalendarId(),
        sendUpdates: 'all',
        requestBody: buildEventBody(input, meetingLink),
    });
    const eventId = response.data.id;
    if (!eventId) {
        throw new Error('Calendar event created but no event ID was returned.');
    }
    return { eventId, meetingLink };
}
async function deleteSessionCalendarEvent(eventId) {
    const calendar = getCalendarClient();
    if (!calendar)
        return;
    try {
        await calendar.events.delete({
            calendarId: getCalendarId(),
            eventId,
            sendUpdates: 'all',
        });
    }
    catch (error) {
        console.warn(`[googleCalendarService] Could not delete event ${eventId}:`, error);
    }
}
//# sourceMappingURL=googleCalendarService.js.map