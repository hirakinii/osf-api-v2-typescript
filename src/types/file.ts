export interface OsfFile {
  id: string;
  type: 'files';
  attributes: {
    name: string;
    kind: 'file' | 'folder';
    path: string;
    materializedPath: string;
    provider: string;
    size?: number;
    currentVersion?: number;
    dateCreated: string;
    dateModified: string;
    currentUserCanComment: boolean;
    guid?: string;
    deleteAllowed: boolean;
    tags?: string[];
    extra?: {
      hashes?: {
        sha256?: string;
        md5?: string;
      };
      downloads?: number;
    };
  };
  relationships?: {
    node?: { links: { related: { href: string } } };
    comments?: { links: { related: { href: string } } };
    versions?: { links: { related: { href: string } } };
  };
  links: {
    self: string;
    info: string;
    move?: string;
    upload?: string;
    download?: string;
    delete?: string;
    new_folder?: string;
  };
}
