/**
 * License attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfLicenseAttributes {
  name: string;
  text: string;
  required_fields: string[];
}

/**
 * Parameters for listing licenses
 */
export interface LicenseListParams {
  'filter[id]'?: string;
  'filter[name]'?: string;
  page?: number;
  [key: string]: unknown;
}
