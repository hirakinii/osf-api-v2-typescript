/**
 * File attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfFileAttributes {
  name: string;
  kind: 'file' | 'folder';
  path: string;
  materialized_path: string;
  provider: string;
  size?: number;
  current_version?: number;
  date_created: string;
  date_modified: string;
  current_user_can_comment: boolean;
  guid?: string;
  delete_allowed: boolean;
  tags?: string[];
  extra?: {
    hashes?: {
      sha256?: string;
      md5?: string;
    };
    downloads?: number;
  };
}

/**
 * File links including Waterbutler API endpoints
 */
export interface OsfFileLinks {
  self: string;
  info: string;
  move?: string;
  upload?: string;
  download?: string;
  delete?: string;
  new_folder?: string;
}

/**
 * File version attributes
 */
export interface FileVersionAttributes {
  size: number;
  content_type: string;
  date_created: string;
  modified: string;
}

/**
 * Full OSF File resource (JSON:API format)
 */
export interface OsfFile {
  id: string;
  type: 'files';
  attributes: OsfFileAttributes;
  relationships?: {
    node?: { links: { related: { href: string } } };
    comments?: { links: { related: { href: string } } };
    versions?: { links: { related: { href: string } } };
  };
  links: OsfFileLinks;
}

/**
 * Storage provider attributes
 */
export interface StorageProviderAttributes {
  name: string;
  kind: 'folder';
  path: string;
  node: string;
  provider: string;
}

/**
 * Parameters for listing files
 */
export interface FileListParams {
  'filter[id]'?: string;
  'filter[name]'?: string;
  'filter[kind]'?: 'file' | 'folder';
  'filter[path]'?: string;
  'filter[provider]'?: string;
  page?: number;
  [key: string]: unknown;
}
