import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfIdentifierAttributes, IdentifierListParams } from '../types/identifier';

/**
 * Identifiers resource class for interacting with OSF identifier endpoints
 *
 * Identifiers are unique permanent references (DOIs, ARKs) to OSF nodes,
 * often registered with external services like DataCite.
 *
 * @example
 * ```typescript
 * const identifiers = new Identifiers(httpClient);
 *
 * // Get an identifier by ID
 * const identifier = await identifiers.getById('57f1641db83f6901ed94b45a');
 *
 * // List identifiers for a node
 * const nodeIds = await identifiers.listByNode('abc12');
 * ```
 */
export class Identifiers extends BaseResource {
  /**
   * Get an identifier by its ID
   *
   * @param id - The unique identifier of the identifier resource
   * @returns The identifier resource
   * @throws {OsfNotFoundError} If identifier is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfIdentifierAttributes>> {
    return super.get<OsfIdentifierAttributes>(`identifiers/${id}/`);
  }

  /**
   * List identifiers for a node
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns List of identifiers for the node
   */
  async listByNode(nodeId: string, params?: IdentifierListParams): Promise<TransformedList<OsfIdentifierAttributes>> {
    return super.list<OsfIdentifierAttributes>(`nodes/${nodeId}/identifiers/`, params);
  }

  /**
   * List identifiers for a node with automatic pagination support
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listByNodePaginated(
    nodeId: string,
    params?: IdentifierListParams,
  ): Promise<PaginatedResult<OsfIdentifierAttributes>> {
    return super.listPaginated<OsfIdentifierAttributes>(`nodes/${nodeId}/identifiers/`, params);
  }

  /**
   * List identifiers for a registration
   *
   * @param registrationId - The unique identifier of the registration
   * @param params - Optional filter and pagination parameters
   * @returns List of identifiers for the registration
   */
  async listByRegistration(
    registrationId: string,
    params?: IdentifierListParams,
  ): Promise<TransformedList<OsfIdentifierAttributes>> {
    return super.list<OsfIdentifierAttributes>(`registrations/${registrationId}/identifiers/`, params);
  }
}
