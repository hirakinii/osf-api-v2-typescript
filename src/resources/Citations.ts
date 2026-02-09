import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfCitationStyleAttributes, CitationStyleListParams } from '../types/citation-style';

/**
 * Citations resource class for interacting with OSF citation style endpoints
 *
 * Citation styles define how references are formatted (e.g. APA, MLA, Chicago).
 * The OSF provides access to a large set of standard citation styles.
 *
 * @example
 * ```typescript
 * const citations = new Citations(httpClient);
 *
 * // List all citation styles
 * const styles = await citations.listStyles();
 *
 * // Get a specific citation style
 * const apa = await citations.getStyle('apa');
 * ```
 */
export class Citations extends BaseResource {
  /**
   * List available citation styles
   *
   * Returns a paginated list of standard citation styles.
   * Can be filtered by id, title, short-title, or summary.
   *
   * @param params - Optional filter and pagination parameters
   * @returns List of citation styles
   */
  async listStyles(params?: CitationStyleListParams): Promise<TransformedList<OsfCitationStyleAttributes>> {
    return super.list<OsfCitationStyleAttributes>('citations/styles/', params);
  }

  /**
   * List citation styles with automatic pagination support
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listStylesPaginated(params?: CitationStyleListParams): Promise<PaginatedResult<OsfCitationStyleAttributes>> {
    return super.listPaginated<OsfCitationStyleAttributes>('citations/styles/', params);
  }

  /**
   * Get a citation style by its ID
   *
   * @param styleId - The unique identifier of the citation style (e.g. 'apa')
   * @returns The citation style resource
   * @throws {OsfNotFoundError} If citation style is not found
   */
  async getStyle(styleId: string): Promise<TransformedResource<OsfCitationStyleAttributes>> {
    return super.get<OsfCitationStyleAttributes>(`citations/styles/${styleId}/`);
  }
}
