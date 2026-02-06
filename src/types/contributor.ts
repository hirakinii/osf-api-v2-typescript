/**
 * Permission levels for contributors
 */
export type ContributorPermission = 'read' | 'write' | 'admin';

/**
 * Contributor attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfContributorAttributes {
  bibliographic: boolean;
  permission: ContributorPermission;
  index: number;
  unregistered_contributor?: string;
}

/**
 * Input for creating a contributor on a node
 */
export interface CreateContributorInput {
  userId: string;
  permission?: ContributorPermission;
  bibliographic?: boolean;
}

/**
 * Input for updating a contributor's attributes
 */
export interface UpdateContributorInput {
  permission?: ContributorPermission;
  bibliographic?: boolean;
}

/**
 * Full OSF Contributor resource (JSON:API format)
 */
export interface OsfContributor {
  id: string;
  type: 'contributors';
  attributes: OsfContributorAttributes;
  relationships?: {
    node?: { links: { related: { href: string } } };
    user?: { links: { related: { href: string } } };
  };
  links?: {
    self: string;
  };
}

/**
 * Parameters for listing contributors
 */
export interface ContributorListParams {
  'filter[bibliographic]'?: boolean;
  'filter[permission]'?: ContributorPermission;
  page?: number;
  [key: string]: unknown;
}
