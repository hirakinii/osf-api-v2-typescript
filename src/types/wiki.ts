/**
 * Wiki attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfWikiAttributes {
  name: string;
  kind: string;
  date_modified: string;
  content_type: string;
  path: string;
  materialized_path: string;
  size: number;
  current_user_can_comment: boolean;
  extra: Record<string, unknown>;
}

/**
 * Wiki version attributes as returned from the OSF API
 */
export interface WikiVersionAttributes {
  date_created: string;
  size: number;
  content_type: string;
}

/**
 * Parameters for listing wikis
 */
export interface WikiListParams {
  'filter[name]'?: string;
  'filter[date_modified]'?: string;
  page?: number;
  [key: string]: unknown;
}
