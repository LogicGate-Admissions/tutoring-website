import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/shared/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AddResourceToBoardRequest = {
  relationshipId?: string;
  resourceId?: string;
  attachment?: {
    title?: string;
    url?: string;
    contentType?: string;
    kind?: string;
    sizeBytes?: number;
  };
  position?: {
    x?: number;
    y?: number;
  };
};

type RelationshipMiroFields = {
  miroBoardId?: string;
  miroBoardUrl?: string;
  miroEmbedUrl?: string;
};

type ResourceDocument = {
  title?: string;
  url?: string;
  attachment?: {
    name?: string;
    title?: string;
    url?: string;
    contentType?: string;
    kind?: string;
    sizeBytes?: number;
  };
};

type MiroItemResponse = {
  id?: string;
  type?: string;
};

const RELATIONSHIPS_COLLECTION = 'studentTutorRelationships';
const MIRO_API_BASE_URL = 'https://api.miro.com/v2';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddResourceToBoardRequest;
    const relationshipId = body.relationshipId?.trim();
    const resourceId = body.resourceId?.trim();
    const attachment = normaliseDirectAttachment(body.attachment);

    if (!relationshipId || (!resourceId && !attachment)) {
      return NextResponse.json(
        { error: 'Missing relationshipId and resource details.' },
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

    const relationship = relationshipSnapshot.data() as RelationshipMiroFields;
    const boardId = relationship.miroBoardId?.trim();

    if (!boardId) {
      return NextResponse.json(
        { error: 'This relationship does not have a Miro board yet.' },
        { status: 400 }
      );
    }

    const resourceSnapshot = resourceId
      ? await relationshipRef.collection('resources').doc(resourceId).get()
      : null;

    if (resourceId && !resourceSnapshot?.exists) {
      return NextResponse.json(
        { error: 'Resource not found.' },
        { status: 404 }
      );
    }

    const resource = attachment
      ? attachment
      : (resourceSnapshot?.data() as ResourceDocument);
    const accessToken = await getMiroAccessToken();
    const miroItem = await createMiroItemFromResource({
      accessToken,
      boardId,
      resource,
      position: normaliseDropPosition(body.position),
    });

    if (resourceSnapshot?.exists) {
      await resourceSnapshot.ref.set(
        {
          lastAddedToMiroAt: new Date().toISOString(),
          lastMiroItemId: miroItem.id ?? null,
          lastMiroItemType: miroItem.type ?? null,
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      miroItemId: miroItem.id,
      miroItemType: miroItem.type,
      miroBoardUrl: relationship.miroBoardUrl,
      miroEmbedUrl: relationship.miroEmbedUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}


function normaliseDirectAttachment(attachment: AddResourceToBoardRequest['attachment']): ResourceDocument | null {
  const url = attachment?.url?.trim();

  if (!url) return null;

  const title = attachment?.title?.trim() || 'Message attachment';

  return {
    title,
    url,
    attachment: {
      name: title,
      title,
      url,
      contentType: attachment?.contentType ?? '',
      kind: attachment?.kind ?? '',
      sizeBytes: attachment?.sizeBytes ?? 0,
    },
  };
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

function normaliseDropPosition(position: AddResourceToBoardRequest['position']) {
  return {
    x: clampNumber(position?.x ?? 0, -5000, 5000),
    y: clampNumber(position?.y ?? 0, -5000, 5000),
    origin: 'center' as const,
  };
}

async function createMiroItemFromResource({
  accessToken,
  boardId,
  resource,
  position,
}: {
  accessToken: string;
  boardId: string;
  resource: ResourceDocument;
  position: { x: number; y: number; origin: 'center' };
}) {
  const title = getResourceTitle(resource);
  const url = getResourceUrl(resource);
  const contentType = resource.attachment?.contentType ?? '';
  const kind = resource.attachment?.kind ?? inferKindFromUrl(url, contentType);

  if (!url) {
    throw new Error('This resource does not have a file URL that can be added to Miro.');
  }

  if (kind === 'image' || contentType.startsWith('image/')) {
    return createMiroImageItem({ accessToken, boardId, title, url, position });
  }

  if (kind === 'pdf' || contentType === 'application/pdf' || title.toLowerCase().endsWith('.pdf')) {
    return createMiroDocumentItem({ accessToken, boardId, title, url, position });
  }

  return createMiroAppCardItem({ accessToken, boardId, title, url, position });
}

async function createMiroImageItem({
  accessToken,
  boardId,
  title,
  url,
  position,
}: {
  accessToken: string;
  boardId: string;
  title: string;
  url: string;
  position: { x: number; y: number; origin: 'center' };
}) {
  return postMiroItem({
    accessToken,
    endpoint: `${MIRO_API_BASE_URL}/boards/${encodeURIComponent(boardId)}/images`,
    body: {
      data: {
        title,
        url,
      },
      position,
      geometry: {
        width: 420,
      },
    },
    fallbackMessage: 'Could not add image to Miro board.',
  });
}

async function createMiroDocumentItem({
  accessToken,
  boardId,
  title,
  url,
  position,
}: {
  accessToken: string;
  boardId: string;
  title: string;
  url: string;
  position: { x: number; y: number; origin: 'center' };
}) {
  return postMiroItem({
    accessToken,
    endpoint: `${MIRO_API_BASE_URL}/boards/${encodeURIComponent(boardId)}/documents`,
    body: {
      data: {
        title,
        url,
      },
      position,
    },
    fallbackMessage: 'Could not add document to Miro board.',
  });
}

async function createMiroAppCardItem({
  accessToken,
  boardId,
  title,
  url,
  position,
}: {
  accessToken: string;
  boardId: string;
  title: string;
  url: string;
  position: { x: number; y: number; origin: 'center' };
}) {
  return postMiroItem({
    accessToken,
    endpoint: `${MIRO_API_BASE_URL}/boards/${encodeURIComponent(boardId)}/app_cards`,
    body: {
      data: {
        title,
        description: 'Shared lesson resource from LogicGate.',
        status: 'connected',
        fields: [
          {
            value: 'Open resource',
            tooltip: url,
          },
        ],
      },
      position,
    },
    fallbackMessage: 'Could not add resource card to Miro board.',
  });
}

async function postMiroItem({
  accessToken,
  endpoint,
  body,
  fallbackMessage,
}: {
  accessToken: string;
  endpoint: string;
  body: Record<string, unknown>;
  fallbackMessage: string;
}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as MiroItemResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    const miroMessage = data.message || data.error || fallbackMessage;
    throw new Error(`Miro add-to-board failed (${response.status}): ${miroMessage}`);
  }

  return data;
}

function getResourceTitle(resource: ResourceDocument) {
  return resource.attachment?.name || resource.title || 'Shared resource';
}

function getResourceUrl(resource: ResourceDocument) {
  return resource.attachment?.url || resource.url || '';
}

function inferKindFromUrl(url: string, contentType: string) {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf' || url.toLowerCase().includes('.pdf')) return 'pdf';
  return 'file';
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, min), max);
}
