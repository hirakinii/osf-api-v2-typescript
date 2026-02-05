export * from './node';
export * from './file';
export * from './user';

export interface JsonApiResponse<T> {
    data: {
        id: string;
        type: string;
        attributes: T;
        relationships?: Record<string, any>;
        links?: Record<string, string>;
    };
    meta?: Record<string, any>;
    links?: Record<string, string>;
}

export interface JsonApiListResponse<T> {
    data: Array<{
        id: string;
        type: string;
        attributes: T;
        relationships?: Record<string, any>;
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
