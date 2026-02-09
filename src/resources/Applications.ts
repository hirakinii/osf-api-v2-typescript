import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import {
  OsfApplicationAttributes,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationListParams,
} from '../types/application';

/**
 * Applications resource class for interacting with OSF OAuth application endpoints
 *
 * Applications represent OAuth2 applications registered by the authenticated user.
 * They allow external services to authenticate via OAuth2.
 *
 * @example
 * ```typescript
 * const apps = new Applications(httpClient);
 *
 * // Get an application by client ID
 * const app = await apps.getById('client_abc123');
 *
 * // List all applications
 * const allApps = await apps.listApplications();
 *
 * // Create a new application
 * const newApp = await apps.create({
 *   name: 'My App',
 *   home_url: 'https://example.com',
 *   callback_url: 'https://example.com/oauth/callback',
 * });
 *
 * // Update an application
 * const updated = await apps.update('client_abc123', { name: 'Updated Name' });
 *
 * // Deactivate an application
 * await apps.delete('client_abc123');
 * ```
 */
export class Applications extends BaseResource {
  /**
   * Get an application by its client ID
   *
   * @param clientId - The application's client_id
   * @returns The application resource
   * @throws {OsfNotFoundError} If application is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(clientId: string): Promise<TransformedResource<OsfApplicationAttributes>> {
    return super.get<OsfApplicationAttributes>(`applications/${clientId}/`);
  }

  /**
   * List registered OAuth applications
   *
   * Returns a paginated list of OAuth2 applications registered by the authenticated user.
   *
   * @param params - Optional pagination parameters
   * @returns List of applications
   */
  async listApplications(params?: ApplicationListParams): Promise<TransformedList<OsfApplicationAttributes>> {
    return super.list<OsfApplicationAttributes>('applications/', params);
  }

  /**
   * List applications with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listApplicationsPaginated(params?: ApplicationListParams): Promise<PaginatedResult<OsfApplicationAttributes>> {
    return super.listPaginated<OsfApplicationAttributes>('applications/', params);
  }

  /**
   * Create a new OAuth application
   *
   * @param data - Application data including name, home_url, and callback_url
   * @returns The created application resource
   * @throws {OsfPermissionError} If user lacks permission to create applications
   */
  async create(data: CreateApplicationInput): Promise<TransformedResource<OsfApplicationAttributes>> {
    const payload = {
      data: {
        type: 'applications',
        attributes: data,
      },
    };
    return super.post<OsfApplicationAttributes>('applications/', payload);
  }

  /**
   * Update an existing OAuth application
   *
   * Fields such as name, description, home_url, or callback_url can be modified.
   *
   * @param clientId - The application's client_id
   * @param data - Fields to update
   * @returns The updated application resource
   * @throws {OsfNotFoundError} If application is not found
   * @throws {OsfPermissionError} If user lacks write access
   */
  async update(clientId: string, data: UpdateApplicationInput): Promise<TransformedResource<OsfApplicationAttributes>> {
    const payload = {
      data: {
        type: 'applications',
        id: clientId,
        attributes: data,
      },
    };
    return super.patch<OsfApplicationAttributes>(`applications/${clientId}/`, payload);
  }

  /**
   * Deactivate an OAuth application
   *
   * Deactivates the application, hiding it from lists without deleting from the database.
   *
   * @param clientId - The application's client_id
   * @throws {OsfNotFoundError} If application is not found
   * @throws {OsfPermissionError} If user lacks permission to deactivate
   */
  async delete(clientId: string): Promise<void> {
    return super.remove(`applications/${clientId}/`);
  }
}
