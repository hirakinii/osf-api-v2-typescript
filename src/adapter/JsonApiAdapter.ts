import { JsonApiResponse, JsonApiListResponse } from '../types';

/**
 * Represents a transformed resource with flattened attributes
 */
export interface TransformedResource<T> {
  id: string;
  type: string;
  relationships?: Record<string, unknown>;
  links?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Represents a transformed list response with metadata and pagination links
 */
export interface TransformedList<T> {
  data: TransformedResource<T>[];
  meta?: Record<string, unknown>;
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

/**
 * Adapter class for transforming JSON:API responses into user-friendly formats
 */
export class JsonApiAdapter {
  /**
   * Transform a single JSON:API resource response
   * Flattens attributes to the top level while preserving id, type, relationships, and links
   *
   * @param response - JSON:API single resource response
   * @returns Transformed resource with flattened attributes
   */
  transformSingle<T>(response: JsonApiResponse<T>): TransformedResource<T> {
    const { id, type, attributes, relationships, links } = response.data;

    // Flatten attributes to top level
    const transformed: TransformedResource<T> = {
      id,
      type,
      ...attributes,
    };

    // Preserve relationships if present
    if (relationships) {
      transformed.relationships = relationships;
    }

    // Preserve links if present
    if (links) {
      transformed.links = links;
    }

    return transformed;
  }

  /**
   * Transform a JSON:API list response
   * Transforms each item in the data array and preserves meta and links
   *
   * @param response - JSON:API list response
   * @returns Transformed list with metadata and pagination links
   */
  transformList<T>(response: JsonApiListResponse<T>): TransformedList<T> {
    // Transform each item in the data array
    const transformedData = response.data.map((item) => {
      const { id, type, attributes, relationships, links } = item;

      const transformed: TransformedResource<T> = {
        id,
        type,
        ...attributes,
      };

      if (relationships) {
        transformed.relationships = relationships;
      }

      if (links) {
        transformed.links = links;
      }

      return transformed;
    });

    // Build the result object
    const result: TransformedList<T> = {
      data: transformedData,
    };

    // Preserve meta information if present
    if (response.meta) {
      result.meta = response.meta;
    }

    // Preserve pagination links if present
    if (response.links) {
      result.links = response.links;
    }

    return result;
  }
}
