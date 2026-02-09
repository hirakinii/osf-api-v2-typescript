/**
 * Comment attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfCommentAttributes {
  can_edit: boolean;
  content: string;
  date_created: string;
  date_modified: string;
  modified: boolean;
  deleted: boolean;
  is_abuse: boolean;
  is_ham: boolean;
  has_report: boolean;
  has_children: boolean;
  page: string;
}

/**
 * Input for creating a new comment on a node
 */
export interface CreateCommentInput {
  content: string;
  target_id?: string;
  target_type?: 'nodes' | 'comments';
}

/**
 * Input for updating an existing comment
 */
export interface UpdateCommentInput {
  content?: string;
  deleted?: boolean;
}

/**
 * Parameters for listing comments
 */
export interface CommentListParams {
  'filter[deleted]'?: string;
  'filter[target_id]'?: string;
  'filter[date_created]'?: string;
  'filter[date_modified]'?: string;
  page?: number;
  [key: string]: unknown;
}
