import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfTokenAttributes, CreateTokenInput, TokenListParams } from '../types/token';
import { OsfScopeAttributes } from '../types/scope';

/**
 * Tokens resource class for interacting with OSF personal access token endpoints
 *
 * Personal access tokens are used to authenticate requests to the OSF API
 * without user credentials. Tokens have associated scopes that determine
 * the level of access they provide.
 *
 * @example
 * ```typescript
 * const tokens = new Tokens(httpClient);
 *
 * // Get a token by ID
 * const token = await tokens.getById('token123');
 *
 * // List all tokens
 * const allTokens = await tokens.listTokens();
 *
 * // Create a new token
 * const newToken = await tokens.create({
 *   name: 'My API Token',
 *   scopes: ['osf.full_write'],
 * });
 *
 * // List scopes of a token
 * const scopes = await tokens.listScopes('token123');
 *
 * // Deactivate a token
 * await tokens.delete('token123');
 * ```
 */
export class Tokens extends BaseResource {
  /**
   * Get a personal access token by its ID
   *
   * @param id - The unique identifier of the token
   * @returns The token resource
   * @throws {OsfNotFoundError} If token is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfTokenAttributes>> {
    return super.get<OsfTokenAttributes>(`tokens/${id}/`);
  }

  /**
   * List personal access tokens
   *
   * Returns a paginated list of active personal access tokens created by the authenticated user.
   *
   * @param params - Optional pagination parameters
   * @returns List of tokens
   */
  async listTokens(params?: TokenListParams): Promise<TransformedList<OsfTokenAttributes>> {
    return super.list<OsfTokenAttributes>('tokens/', params);
  }

  /**
   * List tokens with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listTokensPaginated(params?: TokenListParams): Promise<PaginatedResult<OsfTokenAttributes>> {
    return super.listPaginated<OsfTokenAttributes>('tokens/', params);
  }

  /**
   * Create a new personal access token
   *
   * The token_id is returned only once during creation.
   *
   * @param data - Token data including name and scope IDs
   * @returns The created token resource (includes token_id only on creation)
   * @throws {OsfPermissionError} If user lacks permission to create tokens
   */
  async create(data: CreateTokenInput): Promise<TransformedResource<OsfTokenAttributes>> {
    const payload = {
      data: {
        type: 'tokens',
        attributes: {
          name: data.name,
        },
        relationships: {
          scopes: {
            data: data.scopes.map((scopeId) => ({
              type: 'scopes',
              id: scopeId,
            })),
          },
        },
      },
    };
    return super.post<OsfTokenAttributes>('tokens/', payload);
  }

  /**
   * Deactivate a personal access token
   *
   * The token becomes inactive but is retained in the database.
   *
   * @param id - The unique identifier of the token
   * @throws {OsfNotFoundError} If token is not found
   * @throws {OsfPermissionError} If user lacks permission to deactivate
   */
  async delete(id: string): Promise<void> {
    return super.remove(`tokens/${id}/`);
  }

  /**
   * List scopes associated with a personal access token
   *
   * @param id - The unique identifier of the token
   * @returns List of scopes associated with the token
   * @throws {OsfNotFoundError} If token is not found
   */
  async listScopes(id: string): Promise<TransformedList<OsfScopeAttributes>> {
    return super.list<OsfScopeAttributes>(`tokens/${id}/scopes/`);
  }
}
