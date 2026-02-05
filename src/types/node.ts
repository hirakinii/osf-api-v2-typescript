export interface OsfNode {
  id: string;
  type: 'nodes';
  attributes: {
    title: string;
    description: string;
    category:
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
    currentUserCanComment: boolean;
    dateCreated: string;
    dateModified: string;
    fork: boolean;
    preprint: boolean;
    public: boolean;
    tags: string[];
    templateFrom?: string;
    nodeLicense?: string;
  };
  relationships?: {
    children?: { links: { related: { href: string } } };
    contributors?: { links: { related: { href: string } } };
    files?: { links: { related: { href: string } } };
    parent?: { links: { related: { href: string } } };
    root?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
    html: string;
  };
}
