/**
 * Draft Registration attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfDraftRegistrationAttributes {
  title: string;
  description: string;
  category: string;
  tags: string[];
  current_user_permissions?: string[];
  has_project: boolean;
  datetime_initiated: string;
  datetime_updated: string;
  registration_metadata?: Record<string, unknown>;
  registration_responses?: Record<string, unknown>;
  node_license?: {
    copyright_holders?: string[];
    year?: number;
  };
}

/**
 * Input for creating a new draft registration
 */
export interface CreateDraftRegistrationInput {
  /**
   * The ID of the registration schema to use (required by the API)
   * You can find available schema IDs at: https://api.osf.io/v2/schemas/registrations/
   */
  registration_schema_id: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  node_license?: {
    copyright_holders?: string[];
    year?: number;
  };
  registration_metadata?: Record<string, unknown>;
  registration_responses?: Record<string, unknown>;
  /**
   * Optional: The ID of the node to branch from
   * If provided, the draft registration will be linked to this project
   */
  branched_from?: string;
}

/**
 * Input for updating an existing draft registration
 */
export interface UpdateDraftRegistrationInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  node_license?: {
    copyright_holders?: string[];
    year?: number;
  };
  registration_metadata?: Record<string, unknown>;
  registration_responses?: Record<string, unknown>;
}

/**
 * Full OSF Draft Registration resource (JSON:API format)
 */
export interface OsfDraftRegistration {
  id: string;
  type: 'draft_registrations';
  attributes: OsfDraftRegistrationAttributes;
  relationships?: {
    branched_from?: { links: { related: { href: string } } };
    initiator?: { links: { related: { href: string } } };
    registration_schema?: { links: { related: { href: string } } };
    affiliated_institutions?: { links: { related: { href: string } } };
    contributors?: { links: { related: { href: string } } };
    bibliographic_contributors?: { links: { related: { href: string } } };
    subjects?: { links: { related: { href: string } } };
  };
  links: {
    html: string;
  };
}

/**
 * Parameters for listing draft registrations
 */
export interface DraftRegistrationListParams {
  'filter[id]'?: string;
  'filter[title]'?: string;
  'filter[description]'?: string;
  'filter[date_created]'?: string;
  'filter[date_modified]'?: string;
  page?: number;
  [key: string]: unknown;
}
