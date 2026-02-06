import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfRegistrationAttributes, UpdateRegistrationInput, RegistrationListParams } from '../types/registration';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Registrations resource class for interacting with OSF registration endpoints
 *
 * A registration on the OSF creates a frozen, time-stamped version of a project
 * that cannot be edited or deleted. Registrations can be made public immediately
 * or embargoed for up to 4 years.
 *
 * @example
 * ```typescript
 * const registrations = new Registrations(httpClient);
 *
 * // Get a registration by ID
 * const reg = await registrations.getById('abc12');
 *
 * // List registrations with filters
 * const regList = await registrations.listRegistrations({ 'filter[public]': true });
 *
 * // Update a registration (make public)
 * const updated = await registrations.update('abc12', { public: true });
 *
 * // List child registrations
 * const children = await registrations.listChildren('abc12');
 * ```
 */
export class Registrations extends BaseResource {
  /**
   * Get a registration by its ID
   *
   * @param id - The unique identifier of the registration
   * @returns The registration resource
   * @throws {OsfNotFoundError} If registration is not found
   * @throws {OsfPermissionError} If user lacks read access to embargoed registration
   */
  async getById(id: string): Promise<TransformedResource<OsfRegistrationAttributes>> {
    return super.get<OsfRegistrationAttributes>(`registrations/${id}/`);
  }

  /**
   * List registrations with optional filtering and pagination
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of registrations
   */
  async listRegistrations(params?: RegistrationListParams): Promise<TransformedList<OsfRegistrationAttributes>> {
    return super.list<OsfRegistrationAttributes>('registrations/', params);
  }

  /**
   * List registrations with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await registrations.listRegistrationsPaginated({ 'filter[public]': true });
   *
   * // Iterate through all pages
   * for await (const page of result) {
   *   console.log(`Got ${page.length} registrations`);
   * }
   *
   * // Or iterate through all items
   * for await (const reg of result.items()) {
   *   console.log(reg.title);
   * }
   * ```
   */
  async listRegistrationsPaginated(params?: RegistrationListParams): Promise<PaginatedResult<OsfRegistrationAttributes>> {
    return super.listPaginated<OsfRegistrationAttributes>('registrations/', params);
  }

  /**
   * Update an existing registration
   *
   * Only the `public` field can be modified on a registration.
   * Registrations can only be changed from private to public, not vice versa.
   *
   * @param id - The unique identifier of the registration
   * @param data - Fields to update
   * @returns The updated registration resource
   * @throws {OsfNotFoundError} If registration is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async update(id: string, data: UpdateRegistrationInput): Promise<TransformedResource<OsfRegistrationAttributes>> {
    const payload = {
      data: {
        type: 'registrations',
        id,
        attributes: data,
      },
    };
    return super.patch<OsfRegistrationAttributes>(`registrations/${id}/`, payload);
  }

  /**
   * List child registrations (components)
   *
   * @param id - The unique identifier of the parent registration
   * @returns List of child registrations
   * @throws {OsfNotFoundError} If registration is not found
   */
  async listChildren(id: string): Promise<TransformedList<OsfRegistrationAttributes>> {
    return super.list<OsfRegistrationAttributes>(`registrations/${id}/children/`);
  }

  /**
   * List contributors of a registration
   *
   * @param id - The unique identifier of the registration
   * @returns List of contributors
   */
  async listContributors(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`registrations/${id}/contributors/`);
  }

  /**
   * List files of a registration for a given storage provider
   *
   * @param id - The unique identifier of the registration
   * @param provider - Storage provider name (defaults to 'osfstorage')
   * @returns List of files
   */
  async listFiles(id: string, provider: string = 'osfstorage'): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`registrations/${id}/files/${provider}/`);
  }

  /**
   * List wiki pages of a registration
   *
   * @param id - The unique identifier of the registration
   * @returns List of wiki pages
   */
  async listWikis(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`registrations/${id}/wikis/`);
  }

  /**
   * List logs (activity history) of a registration
   *
   * @param id - The unique identifier of the registration
   * @returns List of log entries
   */
  async listLogs(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`registrations/${id}/logs/`);
  }
}
