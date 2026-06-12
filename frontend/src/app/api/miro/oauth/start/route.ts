import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const clientId = process.env.MIRO_CLIENT_ID;
  const redirectUri = process.env.MIRO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing MIRO_CLIENT_ID or MIRO_REDIRECT_URI.' },
      { status: 500 }
    );
  }

  const authorizeUrl = new URL('https://miro.com/oauth/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'boards:read boards:write');

  return NextResponse.redirect(authorizeUrl);
}
