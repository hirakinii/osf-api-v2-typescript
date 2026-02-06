import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfInstitutionAttributes, InstitutionListParams } from '../types/institution';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Institutions resource class for interacting with OSF institution endpoints
 *
 * Institutions are research organizations that can be affiliated with
 * users, nodes, and registrations on the OSF.
 *
 * @example
 * ```typescript
 * const institutions = new Institutions(httpClient);
 *
 * // Get an institution by ID
 * const inst = await institutions.getById('cos');
 *
 * // List all institutions
 * const instList = await institutions.listInstitutions();
 *
 * // List users affiliated with an institution
 * const users = await institutions.listUsers('cos');
 * ```
 */
export class Institutions extends BaseResource {
  /**
   * Get an institution by its ID
   *
   * @param id - The unique identifier of the institution
   * @returns The institution resource
   * @throws {OsfNotFoundError} If institution is not found
   */
  async getById(id: string): Promise<TransformedResource<OsfInstitutionAttributes>> {
    return super.get<OsfInstitutionAttributes>(`institutions/${id}/`);
  }

  /**
   * List institutions with optional filtering and pagination
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of institutions
   */
  async listInstitutions(params?: InstitutionListParams): Promise<TransformedList<OsfInstitutionAttributes>> {
    return super.list<OsfInstitutionAttributes>('institutions/', params);
  }

  /**
   * List institutions with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await institutions.listInstitutionsPaginated();
   *
   * // Iterate through all pages
   * for await (const page of result) {
   *   console.log(`Got ${page.length} institutions`);
   * }
   *
   * // Or iterate through all items
   * for await (const inst of result.items()) {
   *   console.log(inst.name);
   * }
   * ```
   */
  async listInstitutionsPaginated(params?: InstitutionListParams): Promise<PaginatedResult<OsfInstitutionAttributes>> {
    return super.listPaginated<OsfInstitutionAttributes>('institutions/', params);
  }

  /**
   * List users affiliated with an institution
   *
   * @param institutionId - The unique identifier of the institution
   * @returns List of affiliated users
   * @throws {OsfNotFoundError} If institution is not found
   */
  async listUsers(institutionId: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`institutions/${institutionId}/users/`);
  }

  /**
   * List nodes affiliated with an institution
   *
   * @param institutionId - The unique identifier of the institution
   * @returns List of affiliated nodes
   * @throws {OsfNotFoundError} If institution is not found
   */
  async listNodes(institutionId: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`institutions/${institutionId}/nodes/`);
  }

  /**
   * List registrations affiliated with an institution
   *
   * @param institutionId - The unique identifier of the institution
   * @returns List of affiliated registrations
   * @throws {OsfNotFoundError} If institution is not found
   */
  async listRegistrations(institutionId: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`institutions/${institutionId}/registrations/`);
  }
}
