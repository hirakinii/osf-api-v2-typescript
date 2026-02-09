/**
 * Preprint Provider attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfPreprintProviderAttributes {
  name: string;
  description: string;
  domain: string;
  domain_redirect_enabled: boolean;
  advisory_board: string;
  email_support: string;
  email_contact: string;
  banner_path: string;
  logo_path: string;
  header_text: string;
  social_twitter: string;
  social_facebook: string;
  social_instagram: string;
  example: string;
  subjects_acceptable: unknown[];
}

/**
 * Parameters for listing preprint providers
 */
export interface PreprintProviderListParams {
  'filter[id]'?: string;
  'filter[name]'?: string;
  'filter[description]'?: string;
  page?: number;
  [key: string]: unknown;
}
