/**
 * Identifier attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfIdentifierAttributes {
  category: string;
  value: string;
}

/**
 * Parameters for listing identifiers
 */
export interface IdentifierListParams {
  'filter[category]'?: string;
  page?: number;
  [key: string]: unknown;
}
