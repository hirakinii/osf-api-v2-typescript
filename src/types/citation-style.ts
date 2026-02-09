/**
 * Citation Style attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfCitationStyleAttributes {
  title: string;
  short_title: string;
  summary: string | null;
  date_parsed: string;
}

/**
 * Parameters for listing citation styles
 */
export interface CitationStyleListParams {
  'filter[id]'?: string;
  'filter[title]'?: string;
  'filter[short-title]'?: string;
  'filter[summary]'?: string;
  page?: number;
  [key: string]: unknown;
}
