import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(`Miro OAuth failed: ${error}`, { status: 400 });
  }

  if (!code) {
    return new NextResponse('Missing Miro OAuth code.', { status: 400 });
  }

  const clientId = process.env.MIRO_CLIENT_ID;
  const clientSecret = process.env.MIRO_CLIENT_SECRET;
  const redirectUri = process.env.MIRO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse(
      'Missing MIRO_CLIENT_ID, MIRO_CLIENT_SECRET, or MIRO_REDIRECT_URI.',
      { status: 500 }
    );
  }

  const tokenUrl = new URL('https://api.miro.com/v1/oauth/token');
  tokenUrl.searchParams.set('grant_type', 'authorization_code');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('code', code);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);

  const response = await fetch(tokenUrl, { method: 'POST' });
  const tokenData = await response.json();

  if (!response.ok) {
    return NextResponse.json(tokenData, { status: response.status });
  }

  return NextResponse.json({
    message:
      'Copy MIRO_REFRESH_TOKEN into .env.local and Vercel env vars. Do not commit it.',
    tokenData,
  });
}
