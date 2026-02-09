/**
 * Token attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfTokenAttributes {
  name: string;
  date_created: string;
  token_id?: string;
}

/**
 * Input for creating a new personal access token
 */
export interface CreateTokenInput {
  name: string;
  scopes: string[];
}

/**
 * Parameters for listing tokens
 */
export interface TokenListParams {
  page?: number;
  [key: string]: unknown;
}
