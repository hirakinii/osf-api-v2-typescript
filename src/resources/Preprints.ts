import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfPreprintAttributes, CreatePreprintInput, UpdatePreprintInput, PreprintListParams } from '../types/preprint';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Preprints resource class for interacting with OSF preprint endpoints
 *
 * Preprints are scholarly works shared before peer review, similar to arXiv.
 * They can be associated with a specific preprint provider (e.g., OSF Preprints, SocArXiv).
 *
 * @example
 * ```typescript
 * const preprints = new Preprints(httpClient);
 *
 * // Get a preprint by ID
 * const pp = await preprints.getById('abc12');
 *
 * // List preprints with filters
 * const ppList = await preprints.listPreprints({ 'filter[is_published]': true });
 *
 * // Create a new preprint
 * const newPp = await preprints.create({ title: 'My Preprint' });
 *
 * // Update a preprint
 * const updated = await preprints.update('abc12', { is_published: true });
 *
 * // Get citation in APA style
 * const citation = await preprints.getCitation('abc12', 'apa');
 * ```
 */
export class Preprints extends BaseResource {
  /**
   * Get a preprint by its ID
   *
   * @param id - The unique identifier of the preprint
   * @returns The preprint resource
   * @throws {OsfNotFoundError} If preprint is not found
   * @throws {OsfPermissionError} If user lacks read access to private preprint
   */
  async getById(id: string): Promise<TransformedResource<OsfPreprintAttributes>> {
    return super.get<OsfPreprintAttributes>(`preprints/${id}/`);
  }

  /**
   * List preprints with optional filtering and pagination
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of preprints
   */
  async listPreprints(params?: PreprintListParams): Promise<TransformedList<OsfPreprintAttributes>> {
    return super.list<OsfPreprintAttributes>('preprints/', params);
  }

  /**
   * List preprints with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await preprints.listPreprintsPaginated({ 'filter[is_published]': true });
   *
   * // Iterate through all pages
   * for await (const page of result) {
   *   console.log(`Got ${page.length} preprints`);
   * }
   *
   * // Or iterate through all items
   * for await (const pp of result.items()) {
   *   console.log(pp.title);
   * }
   * ```
   */
  async listPreprintsPaginated(params?: PreprintListParams): Promise<PaginatedResult<OsfPreprintAttributes>> {
    return super.listPaginated<OsfPreprintAttributes>('preprints/', params);
  }

  /**
   * Create a new preprint
   *
   * @param data - Preprint data including title and optional fields
   * @returns The created preprint resource
   * @throws {OsfPermissionError} If user lacks permission to create preprints
   */
  async create(data: CreatePreprintInput): Promise<TransformedResource<OsfPreprintAttributes>> {
    const payload = {
      data: {
        type: 'preprints',
        attributes: data,
      },
    };
    return super.post<OsfPreprintAttributes>('preprints/', payload);
  }

  /**
   * Update an existing preprint
   *
   * @param id - The unique identifier of the preprint
   * @param data - Fields to update
   * @returns The updated preprint resource
   * @throws {OsfNotFoundError} If preprint is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async update(id: string, data: UpdatePreprintInput): Promise<TransformedResource<OsfPreprintAttributes>> {
    const payload = {
      data: {
        type: 'preprints',
        id,
        attributes: data,
      },
    };
    return super.patch<OsfPreprintAttributes>(`preprints/${id}/`, payload);
  }

  /**
   * List contributors of a preprint
   *
   * @param id - The unique identifier of the preprint
   * @returns List of contributors
   * @throws {OsfNotFoundError} If preprint is not found
   */
  async listContributors(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`preprints/${id}/contributors/`);
  }

  /**
   * List files (storage providers) of a preprint
   *
   * @param id - The unique identifier of the preprint
   * @returns List of files
   * @throws {OsfNotFoundError} If preprint is not found
   */
  async listFiles(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`preprints/${id}/files/`);
  }

  /**
   * Get citation details for a preprint
   *
   * When called without a styleId, returns citation metadata in CSL format.
   * When called with a styleId (e.g., 'apa', 'mla'), returns formatted citation string.
   *
   * @param id - The unique identifier of the preprint
   * @param styleId - Optional citation style identifier (e.g., 'apa', 'mla', 'chicago-author-date')
   * @returns Citation resource
   * @throws {OsfNotFoundError} If preprint is not found
   */
  async getCitation(id: string, styleId?: string): Promise<TransformedResource<Record<string, unknown>>> {
    const endpoint = styleId ? `preprints/${id}/citation/${styleId}/` : `preprints/${id}/citation/`;
    return super.get<Record<string, unknown>>(endpoint);
  }
}
