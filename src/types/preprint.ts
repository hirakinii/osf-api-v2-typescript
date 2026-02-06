/**
 * Preprint reviews state values
 */
export type PreprintReviewsState = 'initial' | 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/**
 * Preprint data/prereg links availability state
 */
export type PreprintDataLinksState = 'available' | 'no' | 'not_applicable';

/**
 * Preprint attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfPreprintAttributes {
  title: string;
  description: string;
  date_created: string;
  date_modified: string;
  date_published: string;
  doi: string;
  is_published: boolean;
  is_preprint_orphan: boolean;
  license_record?: Record<string, unknown>;
  tags: string[];
  preprint_doi_created?: string;
  date_withdrawn?: string;
  current_user_permissions?: string[];
  public: boolean;
  reviews_state: PreprintReviewsState;
  date_last_transitioned?: string;
  has_coi?: boolean | null;
  conflict_of_interest_statement?: string | null;
  has_data_links?: PreprintDataLinksState | null;
  why_no_data?: string | null;
  data_links?: string[] | null;
  has_prereg_links?: PreprintDataLinksState | null;
  why_no_prereg?: string | null;
  prereg_links?: string[] | null;
  prereg_link_info?: string | null;
  version?: number;
  is_latest_version?: boolean;
  original_publication_date?: string | null;
  custom_publication_citation?: string | null;
}

/**
 * Input for creating a new preprint
 */
export interface CreatePreprintInput {
  title: string;
  description?: string;
  doi?: string;
  is_published?: boolean;
  tags?: string[];
  license_record?: Record<string, unknown>;
  original_publication_date?: string | null;
  custom_publication_citation?: string | null;
  has_coi?: boolean | null;
  conflict_of_interest_statement?: string | null;
  has_data_links?: PreprintDataLinksState | null;
  why_no_data?: string | null;
  data_links?: string[] | null;
  has_prereg_links?: PreprintDataLinksState | null;
  why_no_prereg?: string | null;
  prereg_links?: string[] | null;
  prereg_link_info?: string | null;
}

/**
 * Input for updating an existing preprint
 */
export interface UpdatePreprintInput {
  title?: string;
  description?: string;
  doi?: string;
  is_published?: boolean;
  tags?: string[];
  license_record?: Record<string, unknown>;
  original_publication_date?: string | null;
  custom_publication_citation?: string | null;
  has_coi?: boolean | null;
  conflict_of_interest_statement?: string | null;
  has_data_links?: PreprintDataLinksState | null;
  why_no_data?: string | null;
  data_links?: string[] | null;
  has_prereg_links?: PreprintDataLinksState | null;
  why_no_prereg?: string | null;
  prereg_links?: string[] | null;
  prereg_link_info?: string | null;
}

/**
 * Full OSF Preprint resource (JSON:API format)
 */
export interface OsfPreprint {
  id: string;
  type: 'preprints';
  attributes: OsfPreprintAttributes;
  relationships?: {
    contributors?: { links: { related: { href: string } } };
    bibliographic_contributors?: { links: { related: { href: string } } };
    citation?: { links: { related: { href: string } } };
    identifiers?: { links: { related: { href: string } } };
    node?: { links: { related: { href: string } } };
    license?: { links: { related: { href: string } } };
    provider?: { links: { related: { href: string } } };
    files?: { links: { related: { href: string } } };
    primary_file?: { links: { related: { href: string } } };
    review_actions?: { links: { related: { href: string } } };
    subjects?: { links: { related: { href: string } } };
    affiliated_institutions?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
    html: string;
    preprint_doi?: string;
  };
}

/**
 * Parameters for listing preprints
 */
export interface PreprintListParams {
  'filter[id]'?: string;
  'filter[is_published]'?: boolean;
  'filter[date_created]'?: string;
  'filter[date_modified]'?: string;
  'filter[provider]'?: string;
  page?: number;
  [key: string]: unknown;
}
