import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfPreprintProviderAttributes, PreprintProviderListParams } from '../types/preprint-provider';

/**
 * PreprintProviders resource class for interacting with OSF preprint provider endpoints
 *
 * Preprint providers are services that host preprints on the OSF platform
 * (e.g., OSF Preprints, SocArXiv, PsyArXiv).
 *
 * @example
 * ```typescript
 * const providers = new PreprintProviders(httpClient);
 *
 * // Get a provider by ID
 * const provider = await providers.getById('osf');
 *
 * // List all preprint providers
 * const allProviders = await providers.list();
 * ```
 */
export class PreprintProviders extends BaseResource {
  /**
   * Get a preprint provider by its ID
   *
   * @param id - The unique identifier of the preprint provider
   * @returns The preprint provider resource
   * @throws {OsfNotFoundError} If provider is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfPreprintProviderAttributes>> {
    return super.get<OsfPreprintProviderAttributes>(`preprint_providers/${id}/`);
  }

  /**
   * List available preprint providers
   *
   * Returns a paginated list of preprint providers.
   * Can be filtered by id, name, or description.
   *
   * @param params - Optional filter and pagination parameters
   * @returns List of preprint providers
   */
  async listProviders(params?: PreprintProviderListParams): Promise<TransformedList<OsfPreprintProviderAttributes>> {
    return super.list<OsfPreprintProviderAttributes>('preprint_providers/', params);
  }

  /**
   * List preprint providers with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listProvidersPaginated(
    params?: PreprintProviderListParams,
  ): Promise<PaginatedResult<OsfPreprintProviderAttributes>> {
    return super.listPaginated<OsfPreprintProviderAttributes>('preprint_providers/', params);
  }
}
