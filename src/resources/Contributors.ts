import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import {
  OsfContributorAttributes,
  CreateContributorInput,
  UpdateContributorInput,
  ContributorListParams,
} from '../types/contributor';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Contributors resource class for interacting with OSF contributor endpoints
 *
 * Contributors are users who can make changes to a node or, in the case of
 * private nodes, have read access to the node. Contributors are categorized
 * as either "bibliographic" or "non-bibliographic".
 *
 * @example
 * ```typescript
 * const contributors = new Contributors(httpClient);
 *
 * // Get a specific contributor
 * const contributor = await contributors.getByNodeAndUser('abc12', 'user1');
 *
 * // List contributors on a node
 * const list = await contributors.listByNode('abc12');
 *
 * // Add a contributor
 * const added = await contributors.addToNode('abc12', { userId: 'user2', permission: 'write' });
 *
 * // Update permissions
 * const updated = await contributors.update('abc12', 'user2', { permission: 'admin' });
 *
 * // Remove a contributor
 * await contributors.removeFromNode('abc12', 'user2');
 * ```
 */
export class Contributors extends BaseResource {
  /**
   * Get a specific contributor by node ID and user ID
   *
   * @param nodeId - The unique identifier of the node
   * @param userId - The unique identifier of the user
   * @returns The contributor resource
   * @throws {OsfNotFoundError} If contributor is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getByNodeAndUser(nodeId: string, userId: string): Promise<TransformedResource<OsfContributorAttributes>> {
    return super.get<OsfContributorAttributes>(`nodes/${nodeId}/contributors/${userId}/`);
  }

  /**
   * List contributors on a node with optional filtering and pagination
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of contributors
   */
  async listByNode(nodeId: string, params?: ContributorListParams): Promise<TransformedList<OsfContributorAttributes>> {
    return super.list<OsfContributorAttributes>(`nodes/${nodeId}/contributors/`, params);
  }

  /**
   * List contributors on a node with automatic pagination support
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listByNodePaginated(
    nodeId: string,
    params?: ContributorListParams,
  ): Promise<PaginatedResult<OsfContributorAttributes>> {
    return super.listPaginated<OsfContributorAttributes>(`nodes/${nodeId}/contributors/`, params);
  }

  /**
   * Add a contributor to a node
   *
   * @param nodeId - The unique identifier of the node
   * @param data - Contributor creation input (userId, permission, bibliographic)
   * @returns The newly created contributor resource
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async addToNode(
    nodeId: string,
    data: CreateContributorInput,
  ): Promise<TransformedResource<OsfContributorAttributes>> {
    const payload = {
      data: {
        type: 'contributors',
        attributes: {
          ...(data.permission !== undefined && { permission: data.permission }),
          ...(data.bibliographic !== undefined && { bibliographic: data.bibliographic }),
        },
        relationships: {
          user: {
            data: {
              type: 'users',
              id: data.userId,
            },
          },
        },
      },
    };
    return super.post<OsfContributorAttributes>(`nodes/${nodeId}/contributors/`, payload);
  }

  /**
   * Update a contributor's attributes (permission, bibliographic status)
   *
   * @param nodeId - The unique identifier of the node
   * @param userId - The unique identifier of the user
   * @param data - Fields to update
   * @returns The updated contributor resource
   * @throws {OsfNotFoundError} If contributor is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async update(
    nodeId: string,
    userId: string,
    data: UpdateContributorInput,
  ): Promise<TransformedResource<OsfContributorAttributes>> {
    const payload = {
      data: {
        type: 'contributors',
        id: `${nodeId}-${userId}`,
        attributes: data,
      },
    };
    return super.patch<OsfContributorAttributes>(`nodes/${nodeId}/contributors/${userId}/`, payload);
  }

  /**
   * Remove a contributor from a node
   *
   * @param nodeId - The unique identifier of the node
   * @param userId - The unique identifier of the user to remove
   * @throws {OsfNotFoundError} If contributor is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async removeFromNode(nodeId: string, userId: string): Promise<void> {
    return super.remove(`nodes/${nodeId}/contributors/${userId}/`);
  }

  /**
   * List contributors on a registration with optional filtering and pagination
   *
   * @param registrationId - The unique identifier of the registration
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of contributors
   */
  async listByRegistration(
    registrationId: string,
    params?: ContributorListParams,
  ): Promise<TransformedList<OsfContributorAttributes>> {
    return super.list<OsfContributorAttributes>(`registrations/${registrationId}/contributors/`, params);
  }
}
