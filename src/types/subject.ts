/**
 * Subject attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfSubjectAttributes {
  text: string;
  taxonomy_name: string;
}

/**
 * Parameters for listing subjects
 */
export interface SubjectListParams {
  'filter[text]'?: string;
  'filter[parent]'?: string;
  page?: number;
  [key: string]: unknown;
}
