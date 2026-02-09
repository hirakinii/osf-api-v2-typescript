import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfCollectionProviderAttributes, CollectionProviderListParams } from '../types/collection-provider';

/**
 * CollectionProviders resource class for interacting with OSF collection provider endpoints
 *
 * Collection providers are services that curate and organize collections of content
 * on the OSF platform.
 *
 * @example
 * ```typescript
 * const providers = new CollectionProviders(httpClient);
 *
 * // Get a provider by ID
 * const provider = await providers.getById('testlab');
 *
 * // List all collection providers
 * const allProviders = await providers.list();
 * ```
 */
export class CollectionProviders extends BaseResource {
  /**
   * Get a collection provider by its ID
   *
   * @param id - The unique identifier of the collection provider
   * @returns The collection provider resource
   * @throws {OsfNotFoundError} If provider is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfCollectionProviderAttributes>> {
    return super.get<OsfCollectionProviderAttributes>(`providers/collections/${id}/`);
  }

  /**
   * List available collection providers
   *
   * Returns a paginated list of collection providers.
   * Can be filtered by id or name.
   *
   * @param params - Optional filter and pagination parameters
   * @returns List of collection providers
   */
  async listProviders(
    params?: CollectionProviderListParams,
  ): Promise<TransformedList<OsfCollectionProviderAttributes>> {
    return super.list<OsfCollectionProviderAttributes>('providers/collections/', params);
  }

  /**
   * List collection providers with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listProvidersPaginated(
    params?: CollectionProviderListParams,
  ): Promise<PaginatedResult<OsfCollectionProviderAttributes>> {
    return super.listPaginated<OsfCollectionProviderAttributes>('providers/collections/', params);
  }
}
