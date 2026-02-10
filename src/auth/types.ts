/** Configuration for OAuth2 Authorization Code flow */
export interface OAuth2Config {
  clientId: string;
  redirectUri: string;
  scope?: string;
  casBaseUrl?: string; // defaults to https://accounts.osf.io
}

/** Parameters for building the authorization URL */
export interface AuthorizationUrlParams {
  state?: string;
  accessType?: 'online' | 'offline';
  approvalPrompt?: 'auto' | 'force';
}

/** PKCE challenge pair */
export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

/** OAuth2 token response from the token endpoint */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** Stored token set with expiration tracking */
export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // ms since epoch
  scope?: string;
}

/** Function that provides the current access token */
export type TokenProvider = () => string | Promise<string>;
