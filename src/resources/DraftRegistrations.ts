import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import {
  OsfDraftRegistrationAttributes,
  CreateDraftRegistrationInput,
  UpdateDraftRegistrationInput,
  DraftRegistrationListParams,
} from '../types/draft-registration';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * DraftRegistrations resource class for interacting with OSF draft registration endpoints
 *
 * A Draft Registration allows users to edit and revise a registration before it is registered.
 * Draft Registrations allow contributors to coordinate on a single registration, uploading files
 * and changing registration metadata before the Registration is archived.
 *
 * @example
 * ```typescript
 * const drafts = new DraftRegistrations(httpClient);
 *
 * // Get a draft registration by ID
 * const draft = await drafts.getById('abc12');
 *
 * // List draft registrations with filters
 * const list = await drafts.listDraftRegistrations({ 'filter[title]': 'my study' });
 *
 * // Create a new draft registration
 * const newDraft = await drafts.create({ title: 'My Study' });
 *
 * // Update a draft registration
 * const updated = await drafts.update('abc12', { title: 'Updated Title' });
 *
 * // Delete a draft registration
 * await drafts.delete('abc12');
 * ```
 */
export class DraftRegistrations extends BaseResource {
  /**
   * Get a draft registration by its ID
   *
   * @param id - The unique identifier of the draft registration
   * @returns The draft registration resource
   * @throws {OsfNotFoundError} If draft registration is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfDraftRegistrationAttributes>> {
    return super.get<OsfDraftRegistrationAttributes>(`draft_registrations/${id}/`);
  }

  /**
   * List draft registrations with optional filtering and pagination
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of draft registrations
   */
  async listDraftRegistrations(
    params?: DraftRegistrationListParams,
  ): Promise<TransformedList<OsfDraftRegistrationAttributes>> {
    return super.list<OsfDraftRegistrationAttributes>('draft_registrations/', params);
  }

  /**
   * List draft registrations with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await drafts.listDraftRegistrationsPaginated();
   *
   * // Iterate through all pages
   * for await (const page of result) {
   *   console.log(`Got ${page.length} drafts`);
   * }
   *
   * // Or iterate through all items
   * for await (const draft of result.items()) {
   *   console.log(draft.title);
   * }
   * ```
   */
  async listDraftRegistrationsPaginated(
    params?: DraftRegistrationListParams,
  ): Promise<PaginatedResult<OsfDraftRegistrationAttributes>> {
    return super.listPaginated<OsfDraftRegistrationAttributes>('draft_registrations/', params);
  }

  /**
   * Create a new draft registration
   *
   * @param data - Draft registration data including optional title and description
   * @returns The created draft registration resource
   * @throws {OsfPermissionError} If user lacks permission to create draft registrations
   */
  async create(data: CreateDraftRegistrationInput): Promise<TransformedResource<OsfDraftRegistrationAttributes>> {
    const payload = {
      data: {
        type: 'draft_registrations',
        attributes: data,
      },
    };
    return super.post<OsfDraftRegistrationAttributes>('draft_registrations/', payload);
  }

  /**
   * Update an existing draft registration
   *
   * Only draft registration contributors with WRITE or ADMIN permissions may update.
   *
   * @param id - The unique identifier of the draft registration
   * @param data - Fields to update
   * @returns The updated draft registration resource
   * @throws {OsfNotFoundError} If draft registration is not found
   * @throws {OsfPermissionError} If user lacks write/admin access
   */
  async update(
    id: string,
    data: UpdateDraftRegistrationInput,
  ): Promise<TransformedResource<OsfDraftRegistrationAttributes>> {
    const payload = {
      data: {
        type: 'draft_registrations',
        id,
        attributes: data,
      },
    };
    return super.patch<OsfDraftRegistrationAttributes>(`draft_registrations/${id}/`, payload);
  }

  /**
   * Delete a draft registration
   *
   * Permanently deletes a draft registration. A draft that has already been registered cannot be deleted.
   * Only draft registration contributors with ADMIN permissions may delete.
   *
   * @param id - The unique identifier of the draft registration
   * @throws {OsfNotFoundError} If draft registration is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async delete(id: string): Promise<void> {
    return super.remove(`draft_registrations/${id}/`);
  }

  /**
   * List contributors of a draft registration
   *
   * @param id - The unique identifier of the draft registration
   * @returns List of contributors
   * @throws {OsfNotFoundError} If draft registration is not found
   */
  async listContributors(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`draft_registrations/${id}/contributors/`);
  }
}
