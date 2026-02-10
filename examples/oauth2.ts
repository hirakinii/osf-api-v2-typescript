import { OsfClient, OsfOAuth2Client, generatePkceChallenge } from '../src';
import type { TokenSet } from '../src';

/**
 * Example demonstrating OAuth2 Authorization Code + PKCE flow:
 * - Building the authorization URL with PKCE
 * - Exchanging the authorization code for tokens
 * - Using OsfClient with OAuth2 authentication
 * - Automatic token refresh
 * - Token persistence (save / restore)
 * - Token revocation
 *
 * Prerequisites:
 *   1. Register an OAuth application on OSF (https://osf.io/settings/applications/)
 *   2. Set the environment variables:
 *      export OAUTH_CLIENT_ID='your-client-id'
 *      export OAUTH_REDIRECT_URI='https://example.com/callback'
 *
 * To run:
 *   npx ts-node examples/oauth2.ts
 */

// ─── Simulated persistent storage ────────────────────────────────
// In a real application, you would store tokens in a database,
// encrypted file, or secure session storage.
let savedTokenSet: TokenSet | null = null;

function saveTokenSet(tokenSet: TokenSet): void {
  savedTokenSet = { ...tokenSet };
  console.log('  [storage] Token set saved.');
}

function loadTokenSet(): TokenSet | null {
  if (savedTokenSet) {
    console.log('  [storage] Token set loaded from storage.');
  }
  return savedTokenSet;
}
// ─────────────────────────────────────────────────────────────────

async function main() {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('Error: OAUTH_CLIENT_ID and OAUTH_REDIRECT_URI are required.');
    console.log('Register an OAuth app at https://osf.io/settings/applications/');
    console.log('Then set:');
    console.log('  export OAUTH_CLIENT_ID="your-client-id"');
    console.log('  export OAUTH_REDIRECT_URI="https://example.com/callback"');
    process.exit(1);
  }

  // ============================================
  // 1. Create the OAuth2 client
  // ============================================
  console.log('=== Step 1: Create OsfOAuth2Client ===');

  const oauth2Client = new OsfOAuth2Client({
    clientId,
    redirectUri,
    scope: 'osf.full_read', // Request read-only access
    // casBaseUrl: 'https://accounts.test.osf.io', // Use staging for testing
  });

  console.log('OAuth2 client created.');
  console.log(`  Client ID: ${clientId}`);
  console.log(`  Redirect URI: ${redirectUri}`);

  // ============================================
  // 2. Build the authorization URL (with PKCE)
  // ============================================
  console.log('\n=== Step 2: Build Authorization URL ===');

  const { url, codeVerifier, codeChallenge } = await oauth2Client.buildAuthorizationUrl({
    state: 'random-csrf-token', // CSRF protection
    accessType: 'offline', // Request a refresh token
    approvalPrompt: 'auto', // Only prompt if not previously approved
  });

  console.log('Authorization URL generated:');
  console.log(`  ${url}`);
  console.log(`\n  Code Verifier (keep secret): ${codeVerifier.substring(0, 20)}...`);
  console.log(`  Code Challenge (sent to server): ${codeChallenge}`);
  console.log('\nDirect the user to this URL. After they approve, they will be');
  console.log('redirected to your redirect_uri with a "code" query parameter.');

  // ============================================
  // 3. Exchange the authorization code for tokens
  // ============================================
  console.log('\n=== Step 3: Exchange Authorization Code ===');

  const authCode = process.env.OAUTH_AUTH_CODE;
  const storedVerifier = process.env.OAUTH_CODE_VERIFIER;

  if (authCode && storedVerifier) {
    try {
      console.log('Exchanging authorization code for tokens...');
      const tokenSet = await oauth2Client.exchangeCode(authCode, storedVerifier);

      console.log('Token exchange successful!');
      console.log(`  Access Token: ${tokenSet.accessToken.substring(0, 20)}...`);
      console.log(`  Refresh Token: ${tokenSet.refreshToken ? 'present' : 'not issued'}`);
      console.log(`  Expires At: ${new Date(tokenSet.expiresAt).toISOString()}`);
      console.log(`  Scope: ${tokenSet.scope || 'not specified'}`);

      // Save tokens for later use
      saveTokenSet(tokenSet);
    } catch (error) {
      console.error('Token exchange failed:', error instanceof Error ? error.message : error);
      console.log('Make sure the authorization code is valid and has not expired.');
    }
  } else {
    console.log('Skipping code exchange (OAUTH_AUTH_CODE and OAUTH_CODE_VERIFIER not set).');
    console.log('After the user authorizes, set:');
    console.log('  export OAUTH_AUTH_CODE="code-from-redirect"');
    console.log('  export OAUTH_CODE_VERIFIER="verifier-from-step-2"');
  }

  // ============================================
  // 4. Use OsfClient with OAuth2 authentication
  // ============================================
  console.log('\n=== Step 4: Use OsfClient with OAuth2 ===');

  const existingTokenSet = loadTokenSet();

  if (existingTokenSet) {
    // Option A: Pass the oauth2Client directly — automatic token refresh
    const client = new OsfClient({
      oauth2Client,
      tokenSet: existingTokenSet,
    });

    try {
      console.log('Fetching your profile with OAuth2...');
      const me = await client.users.me();
      console.log(`  Hello, ${me.full_name}!`);
    } catch (error) {
      console.error('API call failed:', error instanceof Error ? error.message : error);
    }
  } else {
    console.log('No token set available. Complete Steps 2-3 first.');
  }

  // ============================================
  // 5. Using a custom token provider
  // ============================================
  console.log('\n=== Step 5: Custom Token Provider ===');
  console.log('You can also use a custom tokenProvider function:');
  console.log(`
  const client = new OsfClient({
    tokenProvider: async () => {
      // Fetch token from your auth service, vault, etc.
      const token = await myAuthService.getToken();
      return token;
    },
  });
`);

  // ============================================
  // 6. Token management (refresh, expiry, revoke)
  // ============================================
  console.log('=== Step 6: Token Management ===');

  if (existingTokenSet) {
    // Restore tokens into the client
    oauth2Client.setTokenSet(existingTokenSet);

    // Check expiry
    const isExpired = oauth2Client.isTokenExpired();
    console.log(`  Token expired: ${isExpired}`);

    // getAccessToken() auto-refreshes if expired
    try {
      console.log('  Getting a valid access token (auto-refreshes if expired)...');
      const accessToken = await oauth2Client.getAccessToken();
      console.log(`  Access Token: ${accessToken.substring(0, 20)}...`);

      // Save the potentially refreshed token set
      const refreshedTokenSet = oauth2Client.getTokenSet();
      if (refreshedTokenSet) {
        saveTokenSet(refreshedTokenSet);
      }
    } catch (error) {
      console.error('  Token refresh failed:', error instanceof Error ? error.message : error);
    }

    // Revoke token
    if (process.env.DEMO_REVOKE === 'true') {
      console.log('\n  Revoking the current access token...');
      try {
        await oauth2Client.revokeToken();
        console.log('  Token revoked successfully.');
        console.log('  Token set cleared:', oauth2Client.getTokenSet() === null);
      } catch (error) {
        console.error('  Revocation failed:', error instanceof Error ? error.message : error);
      }
    } else {
      console.log('\n  Tip: Set DEMO_REVOKE=true to demo token revocation.');
    }
  } else {
    console.log('  No token set available. Complete Steps 2-3 first.');
  }

  // ============================================
  // 7. PKCE utilities (standalone)
  // ============================================
  console.log('\n=== Step 7: Standalone PKCE Utilities ===');

  const pkce = await generatePkceChallenge();
  console.log('Generated PKCE challenge pair:');
  console.log(`  Verifier (${pkce.codeVerifier.length} chars): ${pkce.codeVerifier.substring(0, 30)}...`);
  console.log(`  Challenge: ${pkce.codeChallenge}`);
}

main();
