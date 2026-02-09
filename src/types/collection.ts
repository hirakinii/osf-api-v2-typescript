/**
 * Collection attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfCollectionAttributes {
  title: string;
  date_created: string;
  date_modified: string;
  bookmarks: boolean;
  is_promoted: boolean;
  is_public: boolean;
  status_choices: string[];
  collected_type_choices: string[];
  volume_choices: string[];
  issue_choices: string[];
  program_area_choices: string[];
}

/**
 * Input for creating a new collection
 */
export interface CreateCollectionInput {
  title: string;
}

/**
 * Parameters for listing collections
 */
export interface CollectionListParams {
  'filter[id]'?: string;
  'filter[title]'?: string;
  page?: number;
  [key: string]: unknown;
}
