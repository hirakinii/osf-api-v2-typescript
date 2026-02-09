import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfScopeAttributes, ScopeListParams } from '../types/scope';

/**
 * Scopes resource class for interacting with OSF OAuth scope endpoints
 *
 * Scopes define the permissions granted to OAuth applications and personal access tokens.
 * All scope endpoints are publicly accessible without authentication.
 *
 * @example
 * ```typescript
 * const scopes = new Scopes(httpClient);
 *
 * // Get a scope by ID
 * const scope = await scopes.getById('osf.full_write');
 *
 * // List all scopes
 * const allScopes = await scopes.listScopes();
 * ```
 */
export class Scopes extends BaseResource {
  /**
   * Get an OAuth scope by its ID
   *
   * @param id - The unique identifier of the scope (e.g. 'osf.full_write')
   * @returns The scope resource
   * @throws {OsfNotFoundError} If scope is not found
   */
  async getById(id: string): Promise<TransformedResource<OsfScopeAttributes>> {
    return super.get<OsfScopeAttributes>(`scopes/${id}/`);
  }

  /**
   * List available OAuth scopes
   *
   * Returns a paginated list of publicly available OAuth scopes.
   *
   * @param params - Optional pagination parameters
   * @returns List of scopes
   */
  async listScopes(params?: ScopeListParams): Promise<TransformedList<OsfScopeAttributes>> {
    return super.list<OsfScopeAttributes>('scopes/', params);
  }

  /**
   * List OAuth scopes with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listScopesPaginated(params?: ScopeListParams): Promise<PaginatedResult<OsfScopeAttributes>> {
    return super.listPaginated<OsfScopeAttributes>('scopes/', params);
  }
}
