/**
 * User attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfUserAttributes {
  full_name: string;
  given_name: string;
  middle_names: string;
  family_name: string;
  suffix: string;
  date_registered: string;
  active: boolean;
  timezone?: string;
  locale?: string;
  social?: Record<string, string | string[]>;
  employment?: EmploymentRecord[];
  education?: EducationRecord[];
}

export interface EmploymentRecord {
  institution: string;
  title?: string;
  department?: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  ongoing: boolean;
}

export interface EducationRecord {
  institution: string;
  degree?: string;
  department?: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  ongoing: boolean;
}

/**
 * Full OSF User resource (JSON:API format)
 */
export interface OsfUser {
  id: string;
  type: 'users';
  attributes: OsfUserAttributes;
  relationships?: {
    nodes?: { links: { related: { href: string } } };
    institutions?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
    html: string;
    profile_image?: string;
  };
}

/**
 * Parameters for listing users
 */
export interface UserListParams {
  'filter[id]'?: string;
  'filter[full_name]'?: string;
  'filter[given_name]'?: string;
  'filter[middle_name]'?: string;
  'filter[family_name]'?: string;
  page?: number;
  [key: string]: unknown;
}
