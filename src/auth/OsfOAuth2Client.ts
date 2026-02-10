import { OAuth2Config, AuthorizationUrlParams, TokenResponse, TokenSet } from './types';
import { generatePkceChallenge } from './pkce';

const DEFAULT_CAS_BASE_URL = 'https://accounts.osf.io';
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 60 seconds

export class OsfOAuth2Client {
  private config: OAuth2Config;
  private casBaseUrl: string;
  private currentTokenSet: TokenSet | null = null;
  private refreshPromise: Promise<TokenSet> | null = null;

  constructor(config: OAuth2Config) {
    if (!config.clientId) {
      throw new Error('clientId is required');
    }
    if (!config.redirectUri) {
      throw new Error('redirectUri is required');
    }
    this.config = config;
    this.casBaseUrl = config.casBaseUrl ?? DEFAULT_CAS_BASE_URL;
  }

  /**
   * Build the authorization URL with PKCE parameters.
   * Returns the URL along with the code verifier/challenge for later use.
   */
  async buildAuthorizationUrl(params?: AuthorizationUrlParams): Promise<{
    url: string;
    codeVerifier: string;
    codeChallenge: string;
  }> {
    const { codeVerifier, codeChallenge } = await generatePkceChallenge();

    const url = new URL('/oauth2/authorize', this.casBaseUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', this.config.redirectUri);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    if (this.config.scope) {
      url.searchParams.set('scope', this.config.scope);
    }
    if (params?.state) {
      url.searchParams.set('state', params.state);
    }
    if (params?.accessType) {
      url.searchParams.set('access_type', params.accessType);
    }
    if (params?.approvalPrompt) {
      url.searchParams.set('approval_prompt', params.approvalPrompt);
    }

    return { url: url.toString(), codeVerifier, codeChallenge };
  }

  /**
   * Exchange an authorization code for tokens.
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(`${this.casBaseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const tokenResponse: TokenResponse = await response.json();
    const tokenSet = this.tokenResponseToTokenSet(tokenResponse);
    this.currentTokenSet = tokenSet;
    return tokenSet;
  }

  /**
   * Refresh the access token using a refresh token.
   * @param refreshToken - Optional override; defaults to the stored refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<TokenSet> {
    const token = refreshToken ?? this.currentTokenSet?.refreshToken;
    if (!token) {
      throw new Error('No refresh token available');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token,
      client_id: this.config.clientId,
    });

    const response = await fetch(`${this.casBaseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenResponse: TokenResponse = await response.json();
    const tokenSet = this.tokenResponseToTokenSet(tokenResponse);

    // Preserve the old refresh token if the server doesn't issue a new one
    if (!tokenSet.refreshToken && this.currentTokenSet?.refreshToken) {
      tokenSet.refreshToken = this.currentTokenSet.refreshToken;
    }

    this.currentTokenSet = tokenSet;
    return tokenSet;
  }

  /**
   * Revoke the current access token (or a specified token).
   */
  async revokeToken(token?: string): Promise<void> {
    const tokenToRevoke = token ?? this.currentTokenSet?.accessToken;
    if (!tokenToRevoke) {
      throw new Error('No token to revoke');
    }

    const body = new URLSearchParams({ token: tokenToRevoke });

    const response = await fetch(`${this.casBaseUrl}/oauth2/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token revocation failed: ${response.status} ${errorText}`);
    }

    // Clear internal token state if we revoked the stored token
    if (!token || token === this.currentTokenSet?.accessToken) {
      this.currentTokenSet = null;
    }
  }

  /**
   * Get a valid access token, automatically refreshing if expired.
   * Concurrent calls share the same refresh promise to avoid race conditions.
   */
  async getAccessToken(): Promise<string> {
    if (!this.currentTokenSet) {
      throw new Error('No token set');
    }
    if (this.isTokenExpired()) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAccessToken().finally(() => {
          this.refreshPromise = null;
        });
      }
      await this.refreshPromise;
    }
    return this.currentTokenSet!.accessToken;
  }

  /**
   * Store a token set (e.g. restored from persistent storage).
   */
  setTokenSet(tokenSet: TokenSet): void {
    this.currentTokenSet = { ...tokenSet };
  }

  /**
   * Retrieve the current token set, or null if not set.
   * Returns a copy to prevent external mutation.
   */
  getTokenSet(): TokenSet | null {
    if (!this.currentTokenSet) return null;
    return { ...this.currentTokenSet };
  }

  /**
   * Check whether the current access token is expired (with 60s buffer).
   */
  isTokenExpired(): boolean {
    if (!this.currentTokenSet) return true;
    return Date.now() >= this.currentTokenSet.expiresAt - TOKEN_EXPIRY_BUFFER_MS;
  }

  private tokenResponseToTokenSet(response: TokenResponse): TokenSet {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      scope: response.scope,
    };
  }
}
