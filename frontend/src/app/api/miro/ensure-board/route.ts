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
  subject?: string;
  level?: string;
};

type MiroBoardResponse = {
  id?: string;
  name?: string;
  viewLink?: string;
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
        { status: 400 },
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
        { status: 404 },
      );
    }

    const relationship = relationshipSnapshot.data() as RelationshipDocument;

    if (relationship.miroBoardId && relationship.miroEmbedUrl) {
      return NextResponse.json({
        miroBoardId: relationship.miroBoardId,
        miroBoardUrl: relationship.miroBoardUrl,
        miroEmbedUrl: ensureAutoplayEmbedUrl(relationship.miroEmbedUrl),
        reusedExistingBoard: true,
      });
    }

    const accessToken = await getMiroAccessToken();
    const createdBoard = await createMiroBoard({ accessToken, relationship });
    const boardId = requireMiroBoardId(createdBoard);
    const boardUrl = createdBoard.viewLink || `https://miro.com/app/board/${boardId}/`;
    const embedUrl = ensureAutoplayEmbedUrl(`https://miro.com/app/live-embed/${boardId}/`);
    const now = new Date().toISOString();

    await relationshipRef.set(
      {
        miroBoardId: boardId,
        miroBoardUrl: boardUrl,
        miroEmbedUrl: embedUrl,
        miroBoardName: createdBoard.name ?? buildBoardName(relationship),
        miroCreatedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({
      miroBoardId: boardId,
      miroBoardUrl: boardUrl,
      miroEmbedUrl: embedUrl,
      reusedExistingBoard: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';

    return NextResponse.json({ error: message }, { status: 500 });
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
      'Missing Miro credentials. Add MIRO_ACCESS_TOKEN, or add MIRO_CLIENT_ID, MIRO_CLIENT_SECRET, and MIRO_REFRESH_TOKEN.',
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
    }),
  });

  const data = (await response.json()) as MiroBoardResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    const miroMessage = data.message || data.error || 'Could not create Miro board.';
    throw new Error(
      `Miro board creation failed (${response.status}): ${miroMessage}. Check that MIRO_ACCESS_TOKEN is the OAuth access_token from /api/miro/oauth/start and restart npm run dev after editing .env.local.`,
    );
  }

  return data;
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
