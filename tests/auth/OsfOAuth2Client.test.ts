import fetchMock from 'jest-fetch-mock';
import { OsfOAuth2Client } from '../../src/auth/OsfOAuth2Client';
import { TokenSet } from '../../src/auth/types';

const DEFAULT_CONFIG = {
  clientId: 'test-client-id',
  redirectUri: 'https://example.com/callback',
};

function mockTokenResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    scope: 'osf.full_read',
    ...overrides,
  });
}

describe('OsfOAuth2Client', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('constructor', () => {
    it('should throw if clientId is missing', () => {
      expect(
        () => new OsfOAuth2Client({ clientId: '', redirectUri: 'https://example.com/callback' }),
      ).toThrow('clientId is required');
    });

    it('should throw if redirectUri is missing', () => {
      expect(
        () => new OsfOAuth2Client({ clientId: 'test', redirectUri: '' }),
      ).toThrow('redirectUri is required');
    });

    it('should use default casBaseUrl', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const { url } = await client.buildAuthorizationUrl();
      expect(url).toContain('https://accounts.osf.io/oauth2/authorize');
    });

    it('should use custom casBaseUrl', async () => {
      const client = new OsfOAuth2Client({
        ...DEFAULT_CONFIG,
        casBaseUrl: 'https://accounts.test.osf.io',
      });
      const { url } = await client.buildAuthorizationUrl();
      expect(url).toContain('https://accounts.test.osf.io/oauth2/authorize');
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('should include required parameters', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const { url, codeVerifier, codeChallenge } = await client.buildAuthorizationUrl();

      const parsed = new URL(url);
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe('test-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe('https://example.com/callback');
      expect(parsed.searchParams.get('code_challenge')).toBe(codeChallenge);
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(codeVerifier).toBeTruthy();
    });

    it('should include scope when configured', async () => {
      const client = new OsfOAuth2Client({ ...DEFAULT_CONFIG, scope: 'osf.full_read' });
      const { url } = await client.buildAuthorizationUrl();
      const parsed = new URL(url);
      expect(parsed.searchParams.get('scope')).toBe('osf.full_read');
    });

    it('should include optional params when provided', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const { url } = await client.buildAuthorizationUrl({
        state: 'random-state',
        accessType: 'offline',
        approvalPrompt: 'force',
      });

      const parsed = new URL(url);
      expect(parsed.searchParams.get('state')).toBe('random-state');
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('approval_prompt')).toBe('force');
    });

    it('should not include optional params when not provided', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const { url } = await client.buildAuthorizationUrl();
      const parsed = new URL(url);
      expect(parsed.searchParams.has('scope')).toBe(false);
      expect(parsed.searchParams.has('state')).toBe(false);
      expect(parsed.searchParams.has('access_type')).toBe(false);
      expect(parsed.searchParams.has('approval_prompt')).toBe(false);
    });
  });

  describe('exchangeCode', () => {
    it('should POST to the token endpoint with correct body', async () => {
      fetchMock.mockResponseOnce(mockTokenResponse());

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await client.exchangeCode('auth-code-123', 'verifier-456');

      expect(fetchMock.mock.calls[0][0]).toBe('https://accounts.osf.io/oauth2/token');
      const options = fetchMock.mock.calls[0][1]!;
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });

      const body = new URLSearchParams(options.body as string);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('auth-code-123');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('redirect_uri')).toBe('https://example.com/callback');
      expect(body.get('code_verifier')).toBe('verifier-456');
    });

    it('should return a TokenSet and store it internally', async () => {
      fetchMock.mockResponseOnce(mockTokenResponse());

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const tokenSet = await client.exchangeCode('code', 'verifier');

      expect(tokenSet.accessToken).toBe('mock-access-token');
      expect(tokenSet.refreshToken).toBe('mock-refresh-token');
      expect(tokenSet.scope).toBe('osf.full_read');
      expect(tokenSet.expiresAt).toBeGreaterThan(Date.now());

      // Should also be stored internally
      expect(client.getTokenSet()?.accessToken).toBe('mock-access-token');
    });

    it('should throw on error response with sanitized message', async () => {
      fetchMock.mockResponseOnce('not json at all', { status: 400 });

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.exchangeCode('bad-code', 'verifier')).rejects.toThrow(
        'Token exchange failed: 400 Bad Request',
      );
    });

    it('should extract error_description from JSON error response', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ error: 'invalid_grant', error_description: 'Authorization code expired' }),
        { status: 400 },
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.exchangeCode('bad-code', 'verifier')).rejects.toThrow(
        'Token exchange failed: 400 Bad Request - Authorization code expired',
      );
    });

    it('should extract error field when error_description is absent', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ error: 'invalid_grant' }),
        { status: 400 },
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.exchangeCode('bad-code', 'verifier')).rejects.toThrow(
        'Token exchange failed: 400 Bad Request - invalid_grant',
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should POST with grant_type=refresh_token', async () => {
      fetchMock.mockResponseOnce(mockTokenResponse());

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'old-token',
        refreshToken: 'stored-refresh-token',
        expiresAt: 0,
      });

      await client.refreshAccessToken();

      const body = new URLSearchParams(fetchMock.mock.calls[0][1]!.body as string);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('stored-refresh-token');
      expect(body.get('client_id')).toBe('test-client-id');
    });

    it('should preserve old refresh token if server does not issue a new one', async () => {
      fetchMock.mockResponseOnce(
        mockTokenResponse({ refresh_token: undefined }),
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        expiresAt: 0,
      });

      const tokenSet = await client.refreshAccessToken();
      expect(tokenSet.refreshToken).toBe('old-refresh');
    });

    it('should throw if no refresh token is available', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token',
        expiresAt: Date.now() + 3600000,
      });

      await expect(client.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('should allow passing an explicit refresh token', async () => {
      fetchMock.mockResponseOnce(mockTokenResponse());

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await client.refreshAccessToken('explicit-refresh-token');

      const body = new URLSearchParams(fetchMock.mock.calls[0][1]!.body as string);
      expect(body.get('refresh_token')).toBe('explicit-refresh-token');
    });

    it('should throw sanitized error on failure with JSON response', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token revoked' }),
        { status: 400 },
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.refreshAccessToken('bad-token')).rejects.toThrow(
        'Token refresh failed: 400 Bad Request - Refresh token revoked',
      );
    });

    it('should throw sanitized error on failure with non-JSON response', async () => {
      fetchMock.mockResponseOnce('Internal server error with sensitive data', { status: 500 });

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.refreshAccessToken('some-token')).rejects.toThrow(
        'Token refresh failed: 500 Internal Server Error',
      );
    });
  });

  describe('revokeToken', () => {
    it('should POST to the revoke endpoint', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token-to-revoke',
        expiresAt: Date.now() + 3600000,
      });

      await client.revokeToken();

      expect(fetchMock.mock.calls[0][0]).toBe('https://accounts.osf.io/oauth2/revoke');
      const body = new URLSearchParams(fetchMock.mock.calls[0][1]!.body as string);
      expect(body.get('token')).toBe('token-to-revoke');
    });

    it('should clear internal token state after revoking stored token', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token',
        expiresAt: Date.now() + 3600000,
      });

      await client.revokeToken();
      expect(client.getTokenSet()).toBeNull();
    });

    it('should not clear internal token state when revoking an explicit different token', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'my-token',
        expiresAt: Date.now() + 3600000,
      });

      await client.revokeToken('other-token');
      expect(client.getTokenSet()?.accessToken).toBe('my-token');
    });

    it('should throw if no token is available to revoke', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.revokeToken()).rejects.toThrow('No token to revoke');
    });

    it('should throw sanitized error on failure with JSON response', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ error: 'invalid_token', error_description: 'Token not found' }),
        { status: 400 },
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token-to-revoke',
        expiresAt: Date.now() + 3600000,
      });

      await expect(client.revokeToken()).rejects.toThrow(
        'Token revocation failed: 400 Bad Request - Token not found',
      );
    });

    it('should throw sanitized error on failure with non-JSON response', async () => {
      fetchMock.mockResponseOnce('raw server error with token fragments', { status: 503 });

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token-to-revoke',
        expiresAt: Date.now() + 3600000,
      });

      await expect(client.revokeToken()).rejects.toThrow(
        'Token revocation failed: 503 Service Unavailable',
      );
    });
  });

  describe('getAccessToken', () => {
    it('should return the current token if not expired', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'valid-token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000,
      });

      const token = await client.getAccessToken();
      expect(token).toBe('valid-token');
      expect(fetchMock.mock.calls).toHaveLength(0);
    });

    it('should auto-refresh when token is expired', async () => {
      fetchMock.mockResponseOnce(
        mockTokenResponse({ access_token: 'new-token' }),
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'expired-token',
        refreshToken: 'refresh',
        expiresAt: 0, // already expired
      });

      const token = await client.getAccessToken();
      expect(token).toBe('new-token');
    });

    it('should throw if no token set is available', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      await expect(client.getAccessToken()).rejects.toThrow('No token set');
    });

    it('should throw if token is expired and no refresh token is available', async () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'expired-token',
        expiresAt: 0,
      });

      await expect(client.getAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('should deduplicate concurrent refresh requests', async () => {
      fetchMock.mockResponseOnce(
        mockTokenResponse({ access_token: 'refreshed-token' }),
      );

      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'expired-token',
        refreshToken: 'refresh',
        expiresAt: 0,
      });

      // Fire two concurrent getAccessToken calls
      const [token1, token2] = await Promise.all([
        client.getAccessToken(),
        client.getAccessToken(),
      ]);

      expect(token1).toBe('refreshed-token');
      expect(token2).toBe('refreshed-token');
      // Only one fetch call should have been made
      expect(fetchMock.mock.calls).toHaveLength(1);
    });
  });

  describe('setTokenSet / getTokenSet', () => {
    it('should store and retrieve the token set', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const tokenSet: TokenSet = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 3600000,
        scope: 'osf.full_read',
      };

      client.setTokenSet(tokenSet);
      expect(client.getTokenSet()).toEqual(tokenSet);
    });

    it('should return a copy, not the original reference', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      const tokenSet: TokenSet = {
        accessToken: 'token',
        expiresAt: Date.now() + 3600000,
      };

      client.setTokenSet(tokenSet);
      const retrieved = client.getTokenSet()!;
      retrieved.accessToken = 'mutated';

      // Internal state should not be affected
      expect(client.getTokenSet()!.accessToken).toBe('token');
    });

    it('should return null when no token is set', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      expect(client.getTokenSet()).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no token set', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      expect(client.isTokenExpired()).toBe(true);
    });

    it('should return false when token is far from expiry', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token',
        expiresAt: Date.now() + 3600000,
      });
      expect(client.isTokenExpired()).toBe(false);
    });

    it('should return true when token is within 60s buffer of expiry', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token',
        expiresAt: Date.now() + 30000, // 30 seconds from now (within 60s buffer)
      });
      expect(client.isTokenExpired()).toBe(true);
    });

    it('should return true when token is already expired', () => {
      const client = new OsfOAuth2Client(DEFAULT_CONFIG);
      client.setTokenSet({
        accessToken: 'token',
        expiresAt: Date.now() - 1000,
      });
      expect(client.isTokenExpired()).toBe(true);
    });
  });
});
