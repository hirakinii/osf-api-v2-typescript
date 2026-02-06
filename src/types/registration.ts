import { NodeCategory } from './node';

/**
 * Registration state values
 */
export type RegistrationState = 'public' | 'embargoed' | 'withdrawn' | 'pending_embargo' | 'pending_withdrawal';

/**
 * Registration attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfRegistrationAttributes {
  title: string;
  description: string;
  category: NodeCategory;
  current_user_can_comment: boolean;
  current_user_permissions?: string[];
  date_created: string;
  date_modified: string;
  date_registered: string;
  date_withdrawn?: string;
  embargo_end_date?: string;
  fork: boolean;
  preprint: boolean;
  public: boolean;
  registration: boolean;
  collection: boolean;
  withdrawn: boolean;
  pending_embargo_approval: boolean;
  pending_registration_approval: boolean;
  pending_withdrawal: boolean;
  registration_supplement?: string;
  registered_meta?: Record<string, unknown>;
  withdrawal_justification?: string;
  tags: string[];
  template_from?: string;
  node_license?: string;
}

/**
 * Input for updating a registration (only public field can be changed)
 */
export interface UpdateRegistrationInput {
  public?: boolean;
}

/**
 * Full OSF Registration resource (JSON:API format)
 */
export interface OsfRegistration {
  id: string;
  type: 'registrations';
  attributes: OsfRegistrationAttributes;
  relationships?: {
    children?: { links: { related: { href: string } } };
    contributors?: { links: { related: { href: string } } };
    files?: { links: { related: { href: string } } };
    parent?: { links: { related: { href: string } } };
    root?: { links: { related: { href: string } } };
    affiliated_institutions?: { links: { related: { href: string } } };
    forks?: { links: { related: { href: string } } };
    logs?: { links: { related: { href: string } } };
    wikis?: { links: { related: { href: string } } };
    registered_from?: { links: { related: { href: string } } };
    registered_by?: { links: { related: { href: string } } };
    registration_schema?: { links: { related: { href: string } } };
    identifiers?: { links: { related: { href: string } } };
    comments?: { links: { related: { href: string } } };
    linked_nodes?: { links: { related: { href: string } } };
    view_only_links?: { links: { related: { href: string } } };
    citation?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
    html: string;
  };
}

/**
 * Parameters for listing registrations
 */
export interface RegistrationListParams {
  'filter[id]'?: string;
  'filter[title]'?: string;
  'filter[category]'?: NodeCategory;
  'filter[description]'?: string;
  'filter[public]'?: boolean;
  'filter[tags]'?: string;
  'filter[date_created]'?: string;
  'filter[date_modified]'?: string;
  'filter[root]'?: string;
  'filter[parent]'?: string;
  'filter[contributors]'?: string;
  page?: number;
  [key: string]: unknown;
}
