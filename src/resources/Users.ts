import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfUserAttributes, UserListParams } from '../types/user';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Users resource class for interacting with OSF user endpoints
 *
 * @example
 * ```typescript
 * const users = new Users(httpClient);
 *
 * // Get current authenticated user
 * const me = await users.me();
 *
 * // Get user by ID
 * const user = await users.get('abc12');
 *
 * // List users with filters
 * const userList = await users.list({ 'filter[family_name]': 'Smith' });
 * ```
 */
export class Users extends BaseResource {
  /**
   * Get the currently authenticated user
   *
   * @returns The current user's profile
   * @throws {OsfAuthenticationError} If not authenticated
   */
  async me(): Promise<TransformedResource<OsfUserAttributes>> {
    return super.get<OsfUserAttributes>('users/me/');
  }

  /**
   * Get a user by their ID
   *
   * @param id - The unique identifier of the user
   * @returns The user's profile
   * @throws {OsfNotFoundError} If user is not found
   */
  async getById(id: string): Promise<TransformedResource<OsfUserAttributes>> {
    return super.get<OsfUserAttributes>(`users/${id}/`);
  }

  /**
   * List users with optional filtering
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of users
   */
  async listUsers(params?: UserListParams): Promise<TransformedList<OsfUserAttributes>> {
    return super.list<OsfUserAttributes>('users/', params);
  }

  /**
   * List users with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await users.listUsersPaginated({ 'filter[family_name]': 'Smith' });
   *
   * // Iterate through all items
   * for await (const user of result.items()) {
   *   console.log(user.full_name);
   * }
   * ```
   */
  async listUsersPaginated(params?: UserListParams): Promise<PaginatedResult<OsfUserAttributes>> {
    return super.listPaginated<OsfUserAttributes>('users/', params);
  }
}
