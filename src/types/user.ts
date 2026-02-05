export interface OsfUser {
  id: string;
  type: 'users';
  attributes: {
    fullName: string;
    givenName: string;
    middleNames: string;
    familyName: string;
    suffix: string;
    dateRegistered: string;
    active: boolean;
    timezone?: string;
    locale?: string;
    social?: Record<string, string | string[]>;
    employment?: Array<{
      institution: string;
      title?: string;
      department?: string;
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
      ongoing: boolean;
    }>;
    education?: Array<{
      institution: string;
      degree?: string;
      department?: string;
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
      ongoing: boolean;
    }>;
  };
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
