import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PDF_BYTES = 12 * 1024 * 1024;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url.' }, { status: 400 });
  }

  let fileUrl: URL;

  try {
    fileUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url.' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(fileUrl.protocol)) {
    return NextResponse.json(
      { error: 'Only http and https PDF URLs can be previewed.' },
      { status: 400 },
    );
  }

  const fileResponse = await fetch(fileUrl.toString(), {
    headers: { Accept: 'application/pdf,*/*' },
    cache: 'no-store',
  });

  if (!fileResponse.ok || !fileResponse.body) {
    return NextResponse.json(
      { error: `Could not fetch PDF (${fileResponse.status}).` },
      { status: 502 },
    );
  }

  const contentLength = Number(fileResponse.headers.get('content-length') ?? 0);

  if (contentLength > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: 'PDF is too large to preview.' },
      { status: 413 },
    );
  }

  const pdfBytes = await fileResponse.arrayBuffer();

  if (pdfBytes.byteLength > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: 'PDF is too large to preview.' },
      { status: 413 },
    );
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
