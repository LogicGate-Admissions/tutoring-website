/**
 * One-time script to obtain GOOGLE_REFRESH_TOKEN for Calendar API.
 *
 * Before running:
 *   1. In Google Cloud Console → Credentials → your OAuth client → add redirect URI:
 *        http://localhost:3456/oauth2callback
 *   2. Run: node scripts/get-google-refresh-token.mjs
 *   3. Sign in in the browser; paste the printed refresh token into .env.local
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { google } from 'googleapis';

const PORT = 3456;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const root = dirname(fileURLToPath(import.meta.url));
const clientJson = JSON.parse(
  readFileSync(join(root, '..', '.google-oauth-client.json'), 'utf8')
);
const { client_id: clientId, client_secret: clientSecret } = clientJson.web;

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\nOpen this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for callback on', REDIRECT_URI, '...\n');

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(400);
    res.end(`Authorization failed: ${error ?? 'no code'}`);
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Success</h1><p>You can close this tab and check the terminal.</p>');

    console.log('Add this to frontend/.env.local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    if (!tokens.refresh_token) {
      console.warn(
        'No refresh_token returned. Revoke app access at https://myaccount.google.com/permissions and run again with prompt=consent.'
      );
    }
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Token exchange failed');
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);
