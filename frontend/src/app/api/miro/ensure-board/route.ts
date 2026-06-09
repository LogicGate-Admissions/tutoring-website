import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/shared/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EnsureBoardRequest = {
  relationshipId?: string;
};

type RelationshipMiroFields = {
  miroBoardId?: string;
  miroBoardUrl?: string;
  miroEmbedUrl?: string;
};

type RelationshipDocument = RelationshipMiroFields & {
  studentName?: string;
  tutorName?: string;
  studentEmail?: string;
  tutorEmail?: string;
  subject?: string;
  level?: string;
};

type MiroBoardResponse = {
  id?: string;
  name?: string;
  viewLink?: string;
};

type MiroSharingResult = {
  isPublicEditEnabled: boolean;
  error?: string;
};

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';
const MIRO_API_BASE_URL = 'https://api.miro.com/v2';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnsureBoardRequest;
    const relationshipId = body.relationshipId?.trim();

    if (!relationshipId) {
      return NextResponse.json(
        { error: 'Missing relationshipId.' },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDb();
    const relationshipRef = db
      .collection(RELATIONSHIPS_COLLECTION)
      .doc(relationshipId);
    const relationshipSnapshot = await relationshipRef.get();

    if (!relationshipSnapshot.exists) {
      return NextResponse.json(
        { error: 'Relationship not found.' },
        { status: 404 }
      );
    }

    const relationship = relationshipSnapshot.data() as RelationshipDocument;

    const accessToken = await getMiroAccessToken();

    if (relationship.miroBoardId && relationship.miroEmbedUrl) {
      const sharingResult = await makeBoardPublicEditable({
        accessToken,
        boardId: relationship.miroBoardId,
      });

      const now = new Date().toISOString();
      await relationshipRef.set(
        {
          miroPublicEditEnabled: sharingResult.isPublicEditEnabled,
          miroSharingError: sharingResult.error ?? null,
          updatedAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({
        miroBoardId: relationship.miroBoardId,
        miroBoardUrl: relationship.miroBoardUrl,
        miroEmbedUrl: ensureAutoplayEmbedUrl(relationship.miroEmbedUrl),
        reusedExistingBoard: true,
        miroPublicEditEnabled: sharingResult.isPublicEditEnabled,
        miroSharingError: sharingResult.error,
      });
    }

    const createdBoard = await createMiroBoard({
      accessToken,
      relationshipId,
      relationship,
    });
    const boardId = requireMiroBoardId(createdBoard);
    const boardUrl = createdBoard.viewLink || `https://miro.com/app/board/${boardId}/`;
    const embedUrl = ensureAutoplayEmbedUrl(`https://miro.com/app/live-embed/${boardId}/`);
    const sharingResult = await makeBoardPublicEditable({ accessToken, boardId });
    const invitedEmails = await shareBoardWithRelationshipEmails({
      accessToken,
      boardId,
      relationship,
    });

    const now = new Date().toISOString();

    await relationshipRef.set(
      {
        miroBoardId: boardId,
        miroBoardUrl: boardUrl,
        miroEmbedUrl: embedUrl,
        miroBoardName: createdBoard.name ?? buildBoardName(relationship),
        miroInvitedEmails: invitedEmails,
        miroPublicEditEnabled: sharingResult.isPublicEditEnabled,
        miroSharingError: sharingResult.error ?? null,
        miroCreatedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      miroBoardId: boardId,
      miroBoardUrl: boardUrl,
      miroEmbedUrl: embedUrl,
      reusedExistingBoard: false,
      invitedEmails,
      miroPublicEditEnabled: sharingResult.isPublicEditEnabled,
      miroSharingError: sharingResult.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function getMiroAccessToken() {
  const staticAccessToken = normaliseMiroToken(process.env.MIRO_ACCESS_TOKEN);

  if (staticAccessToken) {
    return staticAccessToken;
  }

  const refreshToken = process.env.MIRO_REFRESH_TOKEN;
  const clientId = process.env.MIRO_CLIENT_ID;
  const clientSecret = process.env.MIRO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error(
      'Missing Miro credentials. Add MIRO_ACCESS_TOKEN, or add MIRO_CLIENT_ID, MIRO_CLIENT_SECRET, and MIRO_REFRESH_TOKEN.'
    );
  }

  const tokenUrl = new URL('https://api.miro.com/v1/oauth/token');
  tokenUrl.searchParams.set('grant_type', 'refresh_token');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('refresh_token', refreshToken);

  const response = await fetch(tokenUrl, { method: 'POST' });
  const data = (await response.json()) as { access_token?: string; error?: string };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error || 'Could not refresh Miro access token.');
  }

  return normaliseMiroToken(data.access_token);
}

function normaliseMiroToken(token: string | undefined) {
  const trimmedToken = token?.trim();

  if (!trimmedToken) {
    return '';
  }

  return trimmedToken.replace(/^Bearer\s+/i, '').trim();
}

function buildPublicEditableBoardPolicy() {
  return {
    permissionsPolicy: {
      collaborationToolsStartAccess: 'all_editors',
      copyAccess: 'anyone',
      sharingAccess: 'team_members_with_editing_rights',
    },
    sharingPolicy: {
      access: 'edit',
      inviteToAccountAndBoardLinkAccess: 'editor',
      organizationAccess: 'private',
      teamAccess: 'edit',
    },
  };
}

async function makeBoardPublicEditable({
  accessToken,
  boardId,
}: {
  accessToken: string;
  boardId: string;
}): Promise<MiroSharingResult> {
  const response = await fetch(`${MIRO_API_BASE_URL}/boards/${encodeURIComponent(boardId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      policy: buildPublicEditableBoardPolicy(),
    }),
  });

  if (response.ok) {
    return { isPublicEditEnabled: true };
  }

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  return {
    isPublicEditEnabled: false,
    error: data.message || data.error || `Miro sharing update failed (${response.status}).`,
  };
}

function ensureAutoplayEmbedUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  url.searchParams.set('autoplay', 'true');
  return url.toString();
}

async function createMiroBoard({
  accessToken,
  relationship,
}: {
  accessToken: string;
  relationshipId: string;
  relationship: RelationshipDocument;
}) {
  const response = await fetch(`${MIRO_API_BASE_URL}/boards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: buildBoardName(relationship),
      description: buildBoardDescription(relationship),
      policy: buildPublicEditableBoardPolicy(),
    }),
  });
  const data = (await response.json()) as MiroBoardResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    const miroMessage = data.message || data.error || 'Could not create Miro board.';
    throw new Error(
      `Miro board creation failed (${response.status}): ${miroMessage}. Check that MIRO_ACCESS_TOKEN is the OAuth access_token from /api/miro/oauth/start and restart npm run dev after editing .env.local.`
    );
  }

  return data;
}

async function shareBoardWithRelationshipEmails({
  accessToken,
  boardId,
  relationship,
}: {
  accessToken: string;
  boardId: string;
  relationship: RelationshipDocument;
}) {
  const emails = [relationship.studentEmail, relationship.tutorEmail]
    .map((email) => email?.trim())
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    return [];
  }

  const response = await fetch(`${MIRO_API_BASE_URL}/boards/${boardId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      emails,
      role: 'editor',
      message:
        'You have been added to the shared LogicGate lesson whiteboard for this student-tutor relationship.',
    }),
  });

  if (!response.ok) {
    return [];
  }

  return emails;
}

function requireMiroBoardId(board: MiroBoardResponse) {
  const boardId = board.id?.trim();

  if (!boardId) {
    throw new Error('Miro created a board but did not return a board id.');
  }

  return boardId;
}

function buildBoardName(relationship: RelationshipDocument) {
  const studentName = relationship.studentName || 'Student';
  const tutorName = relationship.tutorName || 'Tutor';
  const subject = relationship.subject || 'Lesson';
  const rawName = `LogicGate - ${studentName} x ${tutorName} - ${subject}`;

  return rawName.slice(0, 60);
}

function buildBoardDescription(relationship: RelationshipDocument) {
  const level = relationship.level ? `${relationship.level} ` : '';
  const subject = relationship.subject || 'lesson';

  return `Persistent ${level}${subject} whiteboard for this LogicGate student-tutor relationship.`;
}
