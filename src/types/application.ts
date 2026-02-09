/**
 * Application attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfApplicationAttributes {
  name: string;
  description: string;
  home_url: string;
  callback_url: string;
  owner: string;
  date_created: string;
}

/**
 * Input for creating a new OAuth application
 */
export interface CreateApplicationInput {
  name: string;
  description?: string;
  home_url: string;
  callback_url: string;
}

/**
 * Input for updating an existing OAuth application
 */
export interface UpdateApplicationInput {
  name?: string;
  description?: string;
  home_url?: string;
  callback_url?: string;
}

/**
 * Parameters for listing applications
 */
export interface ApplicationListParams {
  page?: number;
  [key: string]: unknown;
}
