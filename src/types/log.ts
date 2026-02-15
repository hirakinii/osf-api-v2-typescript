/**
 * Information about a loggable action
 */
export interface OsfLogActionInfo {
  identifier: string;
  description: string;
}

/**
 * Log action types as defined by the OSF API
 */
export type LogAction =
  | 'project_created'
  | 'project_registered'
  | 'project_deleted'
  | 'created_from'
  | 'pointer_created'
  | 'pointer_forked'
  | 'pointer_removed'
  | 'node_removed'
  | 'node_forked'
  | 'made_public'
  | 'made_private'
  | 'tag_added'
  | 'tag_removed'
  | 'edit_title'
  | 'edit_description'
  | 'updated_fields'
  | 'external_ids_added'
  | 'view_only_link_added'
  | 'view_only_link_removed'
  | 'contributor_added'
  | 'contributor_removed'
  | 'contributors_reordered'
  | 'permissions_updated'
  | 'made_contributor_visible'
  | 'made_contributor_invisible'
  | 'wiki_updated'
  | 'wiki_deleted'
  | 'wiki_renamed'
  | 'made_wiki_public'
  | 'made_wiki_private'
  | 'addon_added'
  | 'addon_removed'
  | 'addon_file_moved'
  | 'addon_file_copied'
  | 'addon_file_renamed'
  | 'node_authorized'
  | 'node_deauthorized'
  | 'folder_created'
  | 'file_added'
  | 'file_updated'
  | 'file_removed'
  | 'file_restored'
  | 'comment_added'
  | 'comment_removed'
  | 'comment_updated'
  | 'embargo_initiated'
  | 'embargo_approved'
  | 'embargo_cancelled'
  | 'embargo_completed'
  | 'retraction_initiated'
  | 'retraction_approved'
  | 'retraction_cancelled'
  | 'registration_initiated'
  | 'registration_approved'
  | 'registration_cancelled'
  | string;

/**
 * Parameters associated with a log entry
 * Note: Uses snake_case to match API response format
 */
export interface OsfLogParams {
  addon?: string;
  anonymous_link?: boolean;
  bucket?: string;
  citation_name?: string;
  contributors?: unknown;
  data_set?: string;
  destination?: unknown;
  figshare_title?: string;
  forward_url?: string;
  github_user?: string;
  github_repo?: string;
  file?: unknown;
  filename?: string;
  kind?: string;
  folder?: string;
  folder_name?: string;
  license?: unknown;
  identifiers?: unknown;
  institution?: unknown;
  old_page?: string;
  page?: string;
  page_id?: string;
  params_node?: unknown;
  params_project?: unknown;
  path?: string;
  pointer?: unknown;
  preprint?: string;
  preprint_provider?: string;
  previous_institution?: unknown;
  source?: unknown;
  study?: string;
  tag?: string;
  tags?: string;
  target?: unknown;
  template_node?: unknown;
  title_new?: string;
  title_original?: string;
  updated_fields?: unknown;
  urls?: unknown;
  version?: string;
  wiki?: unknown;
}

/**
 * Log attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfLogAttributes {
  date: string;
  action: LogAction;
  params: OsfLogParams;
}

/**
 * Parameters for listing logs
 */
export interface LogListParams {
  'filter[action]'?: string;
  'filter[date]'?: string;
  page?: number;
  [key: string]: unknown;
}
