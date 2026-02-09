/**
 * Collection Provider attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfCollectionProviderAttributes {
  name: string;
  description: string;
  domain: string;
  domain_redirect_enabled: boolean;
  advisory_board: string;
  email_support: string | null;
  footer_links: string;
  facebook_app_id: string | null;
  allow_submissions: boolean;
  allow_commenting: boolean;
  example: string | null;
  assets: Record<string, string>;
  share_source: string;
  share_publish_type: string;
  permissions: string[];
  reviews_workflow: string;
}

/**
 * Parameters for listing collection providers
 */
export interface CollectionProviderListParams {
  'filter[id]'?: string;
  'filter[name]'?: string;
  page?: number;
  [key: string]: unknown;
}
