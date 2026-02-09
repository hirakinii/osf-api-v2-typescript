/**
 * OAuth Scope attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfScopeAttributes {
  description: string;
}

/**
 * Parameters for listing OAuth scopes
 */
export interface ScopeListParams {
  page?: number;
  [key: string]: unknown;
}
