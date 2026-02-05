/**
 * Node category types
 */
export type NodeCategory =
  | 'analysis'
  | 'communication'
  | 'data'
  | 'hypothesis'
  | 'instrumentation'
  | 'methods and measures'
  | 'procedure'
  | 'project'
  | 'software'
  | 'other';

/**
 * Node attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfNodeAttributes {
  title: string;
  description: string;
  category: NodeCategory;
  current_user_can_comment: boolean;
  current_user_permissions?: string[];
  date_created: string;
  date_modified: string;
  fork: boolean;
  forked_date?: string;
  preprint: boolean;
  public: boolean;
  registration: boolean;
  collection: boolean;
  tags: string[];
  template_from?: string;
  node_license?: string;
}

/**
 * Input for creating a new node
 */
export interface CreateNodeInput {
  title: string;
  category: NodeCategory;
  description?: string;
  public?: boolean;
  tags?: string[];
  template_from?: string;
}

/**
 * Input for updating an existing node
 */
export interface UpdateNodeInput {
  title?: string;
  category?: NodeCategory;
  description?: string;
  public?: boolean;
  tags?: string[];
  node_license?: string;
}

/**
 * Full OSF Node resource (JSON:API format)
 */
export interface OsfNode {
  id: string;
  type: 'nodes';
  attributes: OsfNodeAttributes;
  relationships?: {
    children?: { links: { related: { href: string } } };
    contributors?: { links: { related: { href: string } } };
    files?: { links: { related: { href: string } } };
    parent?: { links: { related: { href: string } } };
    root?: { links: { related: { href: string } } };
    affiliated_institutions?: { links: { related: { href: string } } };
    registrations?: { links: { related: { href: string } } };
    forks?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
    html: string;
  };
}

/**
 * Parameters for listing nodes
 */
export interface NodeListParams {
  'filter[id]'?: string;
  'filter[title]'?: string;
  'filter[category]'?: NodeCategory;
  'filter[description]'?: string;
  'filter[public]'?: boolean;
  'filter[tags]'?: string;
  'filter[date_created]'?: string;
  'filter[date_modified]'?: string;
  'filter[contributors]'?: string;
  'filter[preprint]'?: boolean;
  page?: number;
  [key: string]: unknown;
}
