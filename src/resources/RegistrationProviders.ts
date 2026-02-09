import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfRegistrationProviderAttributes, RegistrationProviderListParams } from '../types/registration-provider';

/**
 * RegistrationProviders resource class for interacting with OSF registration provider endpoints
 *
 * Registration providers are services that manage registrations on the OSF platform
 * (e.g., OSF Registries).
 *
 * @example
 * ```typescript
 * const providers = new RegistrationProviders(httpClient);
 *
 * // Get a provider by ID
 * const provider = await providers.getById('osf');
 *
 * // List all registration providers
 * const allProviders = await providers.list();
 * ```
 */
export class RegistrationProviders extends BaseResource {
  /**
   * Get a registration provider by its ID
   *
   * @param id - The unique identifier of the registration provider
   * @returns The registration provider resource
   * @throws {OsfNotFoundError} If provider is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfRegistrationProviderAttributes>> {
    return super.get<OsfRegistrationProviderAttributes>(`providers/registrations/${id}/`);
  }

  /**
   * List available registration providers
   *
   * Returns a paginated list of registration providers.
   * Can be filtered by id, name, or description.
   *
   * @param params - Optional filter and pagination parameters
   * @returns List of registration providers
   */
  async listProviders(
    params?: RegistrationProviderListParams,
  ): Promise<TransformedList<OsfRegistrationProviderAttributes>> {
    return super.list<OsfRegistrationProviderAttributes>('providers/registrations/', params);
  }

  /**
   * List registration providers with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listProvidersPaginated(
    params?: RegistrationProviderListParams,
  ): Promise<PaginatedResult<OsfRegistrationProviderAttributes>> {
    return super.listPaginated<OsfRegistrationProviderAttributes>('providers/registrations/', params);
  }
}
