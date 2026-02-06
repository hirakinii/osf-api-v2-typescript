/**
 * Assets (logos, banners) associated with an institution
 */
export interface InstitutionAssets {
  logo?: string;
  logo_rounded?: string;
  banner?: string;
  logo_path?: string;
}

/**
 * Institution attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfInstitutionAttributes {
  name: string;
  description: string;
  iri?: string;
  ror_iri?: string;
  iris?: string[];
  assets?: InstitutionAssets;
}

/**
 * Full OSF Institution resource (JSON:API format)
 */
export interface OsfInstitution {
  id: string;
  type: 'institutions';
  attributes: OsfInstitutionAttributes;
  relationships?: {
    nodes?: { links: { related: { href: string } } };
    users?: { links: { related: { href: string } } };
    registrations?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
  };
}

/**
 * Parameters for listing institutions
 */
export interface InstitutionListParams {
  'filter[id]'?: string;
  'filter[name]'?: string;
  'filter[auth_url]'?: string;
  page?: number;
  [key: string]: unknown;
}
