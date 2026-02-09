export * from './node';
export * from './file';
export * from './user';
export * from './registration';
export * from './contributor';
export * from './institution';
export * from './preprint';
export * from './draft-registration';
export * from './collection';
export * from './wiki';

export interface JsonApiResponse<T> {
  data: {
    id: string;
    type: string;
    attributes: T;
    relationships?: Record<string, unknown>;
    links?: Record<string, string>;
  };
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
}

export interface JsonApiListResponse<T> {
  data: Array<{
    id: string;
    type: string;
    attributes: T;
    relationships?: Record<string, unknown>;
    links?: Record<string, string>;
  }>;
  meta?: {
    total?: number;
    per_page?: number;
    version?: string;
  };
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}
