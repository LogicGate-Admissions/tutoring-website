import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/shared/lib/firebaseAdmin';
import { formatStoredSubjectLabel } from '@/shared/utils/subjectLabels';

type StoredAttachment = {
  name?: string;
  url?: string;
  contentType?: string;
  kind?: string;
  sizeBytes?: number;
};

type StoredRelationship = {
  studentId?: string;
  tutorId?: string;
  studentName?: string;
  tutorName?: string;
  tutorEmail?: string;
  level?: string;
  subject?: string;
  requestedSubjects?: Array<{ level?: string; subject?: string; label?: string }>;
};

type StoredMessage = {
  senderId?: string;
  senderRole?: string;
  body?: string;
  attachments?: StoredAttachment[];
  urgency?: string;
  createdAt?: string;
};

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM_ADDRESS = 'LogicGate Admissions <onboarding@resend.dev>';

export async function POST(request: NextRequest) {
  try {
    const idToken = getBearerToken(request);

    if (!idToken) {
      return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 });
    }

    const { relationshipId, messageId } = (await request.json()) as {
      relationshipId?: string;
      messageId?: string;
    };

    if (!relationshipId || !messageId) {
      return NextResponse.json(
        { error: 'Missing relationshipId or messageId.' },
        { status: 400 }
      );
    }

    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const db = getFirebaseAdminDb();

    const relationshipRef = db.collection('studentTutorRelationships').doc(relationshipId);
    const relationshipSnapshot = await relationshipRef.get();

    if (!relationshipSnapshot.exists) {
      return NextResponse.json({ error: 'Relationship not found.' }, { status: 404 });
    }

    const relationship = relationshipSnapshot.data() as StoredRelationship;

    if (relationship.studentId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Only the student in this relationship can send urgent emails.' },
        { status: 403 }
      );
    }

    if (!relationship.tutorEmail) {
      return NextResponse.json(
        { error: 'Tutor email is missing for this relationship.' },
        { status: 400 }
      );
    }

    const messageSnapshot = await relationshipRef.collection('messages').doc(messageId).get();

    if (!messageSnapshot.exists) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    const message = messageSnapshot.data() as StoredMessage;

    if (message.senderId !== decodedToken.uid || message.senderRole !== 'student') {
      return NextResponse.json(
        { error: 'Only student-authored messages can trigger urgent emails.' },
        { status: 403 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const email = buildUrgentEmail({ relationship, message });
    const recipient = getUrgentEmailRecipient(relationship.tutorEmail);
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from:
          process.env.URGENT_EMAIL_FROM ||
          process.env.RESEND_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          DEFAULT_FROM_ADDRESS,
        to: recipient,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      return NextResponse.json(
        { error: formatEmailProviderError(response.status, responseBody) },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, recipient });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not send urgent email.',
      },
      { status: 500 }
    );
  }
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : '';
}

function getUrgentEmailRecipient(tutorEmail: string) {
  /**
   * Resend's default onboarding@resend.dev sender can only send to the
   * Resend account owner's email address. This optional override lets us test
   * the automatic urgent-email flow locally without changing demo tutor data.
   *
   * For the real demo, leave this unset and use a verified Resend domain in
   * URGENT_EMAIL_FROM so the email goes directly to the tutor.
   */
  return process.env.URGENT_EMAIL_TO_OVERRIDE || tutorEmail;
}

function formatEmailProviderError(status: number, responseBody: string) {
  if (status === 403 && responseBody.includes('You can only send testing emails')) {
    return [
      'Resend is still in testing mode for onboarding@resend.dev.',
      'With that default sender, it can only send to the email address used for your Resend account.',
      'For local testing, set URGENT_EMAIL_TO_OVERRIDE to your own Resend account email.',
      'For the real tutor email, verify a domain in Resend and set URGENT_EMAIL_FROM to an address on that verified domain.',
    ].join(' ');
  }

  return `Email provider error ${status}: ${responseBody}`;
}

function buildUrgentEmail({
  relationship,
  message,
}: {
  relationship: StoredRelationship;
  message: StoredMessage;
}) {
  const studentName = relationship.studentName || 'Your student';
  const tutorName = relationship.tutorName || 'Tutor';
  const subjectLabel = getRelationshipSubjectLabel(relationship);
  const body = message.body?.trim() || '';
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const attachmentRows = attachments.map(renderAttachmentRow).join('');
  const attachmentText = attachments.length > 0
    ? attachments
        .map((attachment, index) => `${index + 1}. ${attachment.name || 'Attachment'}${attachment.url ? ` - ${attachment.url}` : ''}`)
        .join('\n')
    : 'No attachments.';

  const subject = `Urgent message from ${studentName}`;
  const messageHtml = body
    ? renderMathTextAsEmailHtml(body)
    : '<p style="margin:0;color:#64748b">No text message was included. Check the support thread for context.</p>';

  const html = `
    <div style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;border:1px solid #e2e8f0;border-radius:24px;background:#ffffff;padding:28px;box-shadow:0 18px 45px rgba(15,23,42,0.08)">
        <p style="margin:0 0 10px 0;color:#dc2626;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase">Urgent student message</p>
        <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:1.25">${escapeHtml(studentName)} needs help</h1>
        <p style="margin:10px 0 0 0;color:#475569;font-size:15px;line-height:1.55">Hi ${escapeHtml(tutorName)}, ${escapeHtml(studentName)} marked this support message as urgent.</p>

        <div style="margin-top:18px;border-radius:18px;background:#fef2f2;border:1px solid #fecaca;padding:14px 16px">
          <p style="margin:0;color:#991b1b;font-size:13px;font-weight:700">Subject</p>
          <p style="margin:4px 0 0 0;color:#7f1d1d;font-size:15px">${escapeHtml(subjectLabel || 'Subject not specified')}</p>
        </div>

        <div style="margin-top:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;padding:16px">
          <p style="margin:0 0 10px 0;color:#334155;font-size:13px;font-weight:700">Message</p>
          ${messageHtml}
        </div>

        <div style="margin-top:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;padding:16px">
          <p style="margin:0 0 10px 0;color:#334155;font-size:13px;font-weight:700">Attachments</p>
          ${attachmentRows || '<p style="margin:0;color:#64748b;font-size:14px">No attachments.</p>'}
        </div>

        <p style="margin:22px 0 0 0;color:#64748b;font-size:13px;line-height:1.55">Open the LogicGate dashboard to reply in the full student-tutor thread.</p>
      </div>
    </div>
  `;

  const text = [
    `Urgent message from ${studentName}`,
    '',
    `Hi ${tutorName},`,
    `${studentName} marked this support message as urgent.`,
    '',
    `Subject: ${subjectLabel || 'Subject not specified'}`,
    '',
    'Message:',
    body || 'No text message was included. Check the support thread for context.',
    '',
    'Attachments:',
    attachmentText,
    '',
    'Open the LogicGate dashboard to reply in the full student-tutor thread.',
  ].join('\n');

  return { subject, html, text };
}

function getRelationshipSubjectLabel(relationship: StoredRelationship) {
  const requestedSubjects = Array.isArray(relationship.requestedSubjects)
    ? relationship.requestedSubjects
    : [];

  if (requestedSubjects.length > 0) {
    return requestedSubjects
      .map((subject) => formatStoredSubjectLabel(subject))
      .filter(Boolean)
      .join(', ');
  }

  return formatStoredSubjectLabel(relationship);
}

function renderAttachmentRow(attachment: StoredAttachment) {
  const name = escapeHtml(attachment.name || 'Attachment');
  const kind = escapeHtml((attachment.kind || attachment.contentType || 'file').toUpperCase());
  const size = formatFileSize(attachment.sizeBytes);

  if (attachment.url) {
    const url = escapeAttribute(attachment.url);
    return `
      <p style="margin:0 0 8px 0;color:#334155;font-size:14px;line-height:1.45">
        <strong>${kind}</strong> <a href="${url}" style="color:#1d4ed8;text-decoration:underline">${name}</a>${size ? ` <span style="color:#94a3b8">${escapeHtml(size)}</span>` : ''}
      </p>
    `;
  }

  return `
    <p style="margin:0 0 8px 0;color:#334155;font-size:14px;line-height:1.45">
      <strong>${kind}</strong> ${name}${size ? ` <span style="color:#94a3b8">${escapeHtml(size)}</span>` : ''}
    </p>
  `;
}

function renderMathTextAsEmailHtml(value: string) {
  const segments = parseMathSegments(value);
  return `<p style="margin:0;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap">${segments
    .map((segment) => {
      if (segment.kind === 'text') return escapeHtml(segment.value);
      return renderMathImage(segment.value);
    })
    .join('')}</p>`;
}

function parseMathSegments(raw: string): Array<{ kind: 'text' | 'math'; value: string }> {
  const segments: Array<{ kind: 'text' | 'math'; value: string }> = [];
  const mathPattern = /(?<!\\)\$([^$]+?)(?<!\\)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: raw.slice(lastIndex, match.index) });
    }
    segments.push({ kind: 'math', value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    segments.push({ kind: 'text', value: raw.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', value: raw }];
}

function renderMathImage(latex: string) {
  const cleanLatex = latex.replaceAll('□', '\\square');
  const src = `https://latex.codecogs.com/svg.image?${encodeURIComponent(cleanLatex)}`;
  return `<img src="${src}" alt="${escapeAttribute(cleanLatex)}" style="display:inline-block;vertical-align:-0.35em;max-height:2.2em;margin:0 2px" />`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function formatFileSize(sizeBytes?: number) {
  if (!sizeBytes || Number.isNaN(sizeBytes)) return '';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
