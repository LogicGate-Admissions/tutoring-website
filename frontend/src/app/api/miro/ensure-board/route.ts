import { NextResponse } from "next/server";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/shared/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnsureBoardRequest = {
  relationshipId?: string;
};

type RelationshipMiroFields = {
  miroBoardId?: string;
  miroBoardUrl?: string;
  miroEmbedUrl?: string;
  miroBoardCreationStatus?: "creating" | "ready" | "error";
  miroBoardCreationStartedAt?: string | null;
  miroBoardCreationError?: string | null;
  miroEditorInviteEmails?: string[];
  miroEditorInvitedAt?: string;
  miroEditorInviteStatus?: "invited" | "error";
  miroEditorInviteError?: string | null;
  miroBoardName?: string;
  miroCreatedAt?: string;
  updatedAt?: string;
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

type BoardCreationClaim =
  | { status: "not-found" }
  | { status: "ready"; relationship: RelationshipDocument }
  | { status: "waiting" }
  | { status: "creator"; relationship: RelationshipDocument };

const RELATIONSHIPS_COLLECTION = "studentTutorRelationships";
const MIRO_API_BASE_URL = "https://api.miro.com/v2";
const BOARD_CREATION_LOCK_STALE_MS = 120_000;
const BOARD_CREATION_WAIT_ATTEMPTS = 20;
const BOARD_CREATION_WAIT_MS = 750;
const MIRO_EDITOR_INVITE_EMAILS_ENV_KEYS = [
  "MIRO_EDITOR_INVITE_EMAILS",
  "MIRO_DEV_TEAM_EMAILS",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnsureBoardRequest;
    const relationshipId = body.relationshipId?.trim();

    if (!relationshipId) {
      return NextResponse.json(
        { error: "Missing relationshipId." },
        { status: 400 },
      );
    }

    const db = getFirebaseAdminDb();
    const relationshipRef = db
      .collection(RELATIONSHIPS_COLLECTION)
      .doc(relationshipId) as DocumentReference<RelationshipDocument>;
    const claim = await reserveMiroBoardCreation(db, relationshipRef);

    if (claim.status === "not-found") {
      return NextResponse.json(
        { error: "Relationship not found." },
        { status: 404 },
      );
    }

    if (claim.status === "ready") {
      const relationship = await ensureConfiguredBoardEditors({
        relationship: claim.relationship,
        relationshipRef,
      });

      return NextResponse.json(buildReadyBoardResponse(relationship, true));
    }

    if (claim.status === "waiting") {
      const relationship = await waitForMiroBoardToBeReady(relationshipRef);

      if (!relationship) {
        return NextResponse.json(
          {
            error:
              "The Miro board is still being created. Please wait a moment and reopen the workspace.",
          },
          { status: 409 },
        );
      }

      const relationshipWithEditors = await ensureConfiguredBoardEditors({
        relationship,
        relationshipRef,
      });

      return NextResponse.json(
        buildReadyBoardResponse(relationshipWithEditors, true),
      );
    }

    const accessToken = await getMiroAccessToken();
    const createdBoard = await createMiroBoard({
      accessToken,
      relationship: claim.relationship,
    });
    const boardId = requireMiroBoardId(createdBoard);
    const boardUrl =
      createdBoard.viewLink || `https://miro.com/app/board/${boardId}/`;
    const embedUrl = ensureAutoplayEmbedUrl(
      `https://miro.com/app/live-embed/${boardId}/`,
    );
    const now = new Date().toISOString();
    const createdBoardFields: RelationshipMiroFields = {
      miroBoardId: boardId,
      miroBoardUrl: boardUrl,
      miroEmbedUrl: embedUrl,
      miroBoardCreationStatus: "ready",
      miroBoardCreationStartedAt: null,
      miroBoardCreationError: null,
    };
    const relationshipWithBoard: RelationshipDocument = {
      ...claim.relationship,
      ...createdBoardFields,
    };

    try {
      await relationshipRef.set(
        {
          ...createdBoardFields,
          miroBoardName:
            createdBoard.name ?? buildBoardName(claim.relationship),
          miroCreatedAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    } catch (error) {
      await relationshipRef.set(
        {
          miroBoardCreationStatus: "error",
          miroBoardCreationError: getErrorMessage(error),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      throw error;
    }

    const relationshipWithEditors = await ensureConfiguredBoardEditors({
      accessToken,
      relationship: relationshipWithBoard,
      relationshipRef,
    });

    return NextResponse.json(
      buildReadyBoardResponse(relationshipWithEditors, false),
    );
  } catch (error) {
    const message = getErrorMessage(error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function reserveMiroBoardCreation(
  db: Firestore,
  relationshipRef: DocumentReference<RelationshipDocument>,
): Promise<BoardCreationClaim> {
  return db.runTransaction(async (transaction) => {
    const relationshipSnapshot = await transaction.get(relationshipRef);

    if (!relationshipSnapshot.exists) {
      return { status: "not-found" };
    }

    const relationship = relationshipSnapshot.data() as RelationshipDocument;

    if (hasUsableMiroBoard(relationship)) {
      return { status: "ready", relationship };
    }

    if (
      relationship.miroBoardCreationStatus === "creating" &&
      !isStaleCreationLock(relationship.miroBoardCreationStartedAt)
    ) {
      return { status: "waiting" };
    }

    transaction.set(
      relationshipRef,
      {
        miroBoardCreationStatus: "creating",
        miroBoardCreationStartedAt: new Date().toISOString(),
        miroBoardCreationError: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return { status: "creator", relationship };
  });
}

async function waitForMiroBoardToBeReady(
  relationshipRef: DocumentReference<RelationshipDocument>,
) {
  for (let attempt = 0; attempt < BOARD_CREATION_WAIT_ATTEMPTS; attempt += 1) {
    await delay(BOARD_CREATION_WAIT_MS);
    const snapshot = await relationshipRef.get();
    const relationship = snapshot.data() as RelationshipDocument | undefined;

    if (relationship && hasUsableMiroBoard(relationship)) {
      return relationship;
    }

    if (relationship?.miroBoardCreationStatus === "error") {
      throw new Error(
        relationship.miroBoardCreationError || "Miro board creation failed.",
      );
    }
  }

  return null;
}

async function ensureConfiguredBoardEditors({
  accessToken,
  relationship,
  relationshipRef,
}: {
  accessToken?: string;
  relationship: RelationshipDocument;
  relationshipRef: DocumentReference<RelationshipDocument>;
}) {
  const boardId = relationship.miroBoardId;
  const configuredEditorEmails = getConfiguredMiroEditorEmails();

  if (!boardId || configuredEditorEmails.length === 0) {
    return relationship;
  }

  const alreadyInvited = new Set(
    (relationship.miroEditorInviteEmails ?? []).map((email) =>
      email.toLowerCase(),
    ),
  );
  const emailsToInvite = configuredEditorEmails.filter(
    (email) => !alreadyInvited.has(email.toLowerCase()),
  );

  if (emailsToInvite.length === 0) {
    return relationship;
  }

  try {
    await shareMiroBoardWithEditors({
      accessToken: accessToken ?? (await getMiroAccessToken()),
      boardId,
      emails: emailsToInvite,
    });

    const invitedEmails = uniqueEmails([
      ...(relationship.miroEditorInviteEmails ?? []),
      ...emailsToInvite,
    ]);
    const update: RelationshipMiroFields = {
      miroEditorInviteEmails: invitedEmails,
      miroEditorInvitedAt: new Date().toISOString(),
      miroEditorInviteStatus: "invited",
      miroEditorInviteError: null,
    };

    await relationshipRef.set(
      {
        ...update,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return { ...relationship, ...update };
  } catch (error) {
    const update: RelationshipMiroFields = {
      miroEditorInviteStatus: "error",
      miroEditorInviteError: getErrorMessage(error),
    };

    await relationshipRef.set(
      {
        ...update,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return { ...relationship, ...update };
  }
}

async function shareMiroBoardWithEditors({
  accessToken,
  boardId,
  emails,
}: {
  accessToken: string;
  boardId: string;
  emails: string[];
}) {
  for (const emailChunk of chunkEmails(emails, 20)) {
    const response = await fetch(
      `${MIRO_API_BASE_URL}/boards/${encodeURIComponent(boardId)}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: emailChunk,
          role: "editor",
          message:
            "You have been added as an editor to the LogicGate lesson workspace.",
        }),
      },
    );
    const data = await readJsonResponse<{ message?: string; error?: string }>(
      response,
    );

    if (!response.ok) {
      throw new Error(
        data.message || data.error || "Could not invite Miro board editors.",
      );
    }
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
      "Missing Miro credentials. Add MIRO_ACCESS_TOKEN, or add MIRO_CLIENT_ID, MIRO_CLIENT_SECRET, and MIRO_REFRESH_TOKEN.",
    );
  }

  const tokenUrl = new URL("https://api.miro.com/v1/oauth/token");
  tokenUrl.searchParams.set("grant_type", "refresh_token");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("refresh_token", refreshToken);

  const response = await fetch(tokenUrl, { method: "POST" });
  const data = await readJsonResponse<{ access_token?: string; error?: string }>(
    response,
  );

  if (!response.ok || !data.access_token) {
    throw new Error(data.error || "Could not refresh Miro access token.");
  }

  return normaliseMiroToken(data.access_token);
}

async function readJsonResponse<T extends object>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

function normaliseMiroToken(token: string | undefined) {
  const trimmedToken = token?.trim();

  if (!trimmedToken) {
    return "";
  }

  return trimmedToken.replace(/^Bearer\s+/i, "").trim();
}

function ensureAutoplayEmbedUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  url.searchParams.set("autoplay", "true");
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
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: buildBoardName(relationship),
      description: buildBoardDescription(relationship),
    }),
  });

  const data = await readJsonResponse<
    MiroBoardResponse & { message?: string; error?: string }
  >(response);

  if (!response.ok) {
    const miroMessage =
      data.message || data.error || "Could not create Miro board.";
    throw new Error(
      `Miro board creation failed (${response.status}): ${miroMessage}. Check that MIRO_ACCESS_TOKEN is the OAuth access_token from /api/miro/oauth/start and restart npm run dev after editing .env.local.`,
    );
  }

  return data;
}

function requireMiroBoardId(board: MiroBoardResponse) {
  const boardId = board.id?.trim();

  if (!boardId) {
    throw new Error("Miro created a board but did not return a board id.");
  }

  return boardId;
}

function buildReadyBoardResponse(
  relationship: RelationshipDocument,
  reusedExistingBoard: boolean,
) {
  const boardId = relationship.miroBoardId;

  if (!boardId || !relationship.miroEmbedUrl) {
    throw new Error("Miro board details are incomplete.");
  }

  return {
    miroBoardId: boardId,
    miroBoardUrl:
      relationship.miroBoardUrl || `https://miro.com/app/board/${boardId}/`,
    miroEmbedUrl: ensureAutoplayEmbedUrl(relationship.miroEmbedUrl),
    reusedExistingBoard,
    miroEditorInviteStatus: relationship.miroEditorInviteStatus,
    miroEditorInviteError: relationship.miroEditorInviteError,
  };
}

function hasUsableMiroBoard(relationship: RelationshipDocument) {
  return Boolean(relationship.miroBoardId && relationship.miroEmbedUrl);
}

function isStaleCreationLock(startedAt: string | null | undefined) {
  if (!startedAt) return true;

  const startedTime = new Date(startedAt).getTime();

  if (Number.isNaN(startedTime)) return true;

  return Date.now() - startedTime > BOARD_CREATION_LOCK_STALE_MS;
}

function buildBoardName(relationship: RelationshipDocument) {
  const studentName = relationship.studentName || "Student";
  const tutorName = relationship.tutorName || "Tutor";
  const subject = relationship.subject || "Lesson";
  const rawName = `LogicGate - ${studentName} x ${tutorName} - ${subject}`;

  return rawName.slice(0, 60);
}

function buildBoardDescription(relationship: RelationshipDocument) {
  const level = relationship.level ? `${relationship.level} ` : "";
  const subject = relationship.subject || "lesson";

  return `Persistent ${level}${subject} whiteboard for this LogicGate student-tutor relationship.`;
}

function getConfiguredMiroEditorEmails() {
  const rawEmails = MIRO_EDITOR_INVITE_EMAILS_ENV_KEYS.map(
    (key) => process.env[key],
  ).find((value) => value?.trim());

  if (!rawEmails) {
    return [];
  }

  return uniqueEmails(
    rawEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter(Boolean),
  );
}

function uniqueEmails(emails: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase();

    if (!seen.has(normalizedEmail)) {
      seen.add(normalizedEmail);
      unique.push(email);
    }
  }

  return unique;
}

function chunkEmails(emails: string[], chunkSize: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < emails.length; index += chunkSize) {
    chunks.push(emails.slice(index, index + chunkSize));
  }

  return chunks;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error.";
}
