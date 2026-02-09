import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfCollectionAttributes, CreateCollectionInput, CollectionListParams } from '../types/collection';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Collections resource class for interacting with OSF collection endpoints
 *
 * Collections allow grouping and curating content on the OSF platform.
 * They can link nodes, registrations, and preprints together.
 *
 * @example
 * ```typescript
 * const collections = new Collections(httpClient);
 *
 * // Get a collection by ID
 * const col = await collections.getById('abc12');
 *
 * // List collections
 * const colList = await collections.listCollections();
 *
 * // Create a new collection
 * const newCol = await collections.create({ title: 'My Collection' });
 *
 * // Link a node to a collection
 * await collections.addLinkedNode('abc12', 'node-id');
 * ```
 */
export class Collections extends BaseResource {
  /**
   * Get a collection by its ID
   *
   * @param id - The unique identifier of the collection
   * @returns The collection resource
   * @throws {OsfNotFoundError} If collection is not found
   * @throws {OsfPermissionError} If user lacks read access to private collection
   */
  async getById(id: string): Promise<TransformedResource<OsfCollectionAttributes>> {
    return super.get<OsfCollectionAttributes>(`collections/${id}/`);
  }

  /**
   * List collections with optional filtering and pagination
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of collections
   */
  async listCollections(params?: CollectionListParams): Promise<TransformedList<OsfCollectionAttributes>> {
    return super.list<OsfCollectionAttributes>('collections/', params);
  }

  /**
   * List collections with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listCollectionsPaginated(params?: CollectionListParams): Promise<PaginatedResult<OsfCollectionAttributes>> {
    return super.listPaginated<OsfCollectionAttributes>('collections/', params);
  }

  /**
   * Create a new collection
   *
   * @param data - Collection data including title
   * @returns The created collection resource
   * @throws {OsfPermissionError} If user lacks permission to create collections
   */
  async create(data: CreateCollectionInput): Promise<TransformedResource<OsfCollectionAttributes>> {
    const payload = {
      data: {
        type: 'collections',
        attributes: data,
      },
    };
    return super.post<OsfCollectionAttributes>('collections/', payload);
  }

  /**
   * Delete a collection
   *
   * @param id - The unique identifier of the collection
   * @throws {OsfNotFoundError} If collection is not found
   * @throws {OsfPermissionError} If user lacks write access
   */
  async delete(id: string): Promise<void> {
    return super.remove(`collections/${id}/`);
  }

  /**
   * List all nodes linked to a collection
   *
   * @param id - The unique identifier of the collection
   * @returns List of linked nodes
   * @throws {OsfNotFoundError} If collection is not found
   */
  async listLinkedNodes(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`collections/${id}/linked_nodes/`);
  }

  /**
   * List all registrations linked to a collection
   *
   * @param id - The unique identifier of the collection
   * @returns List of linked registrations
   * @throws {OsfNotFoundError} If collection is not found
   */
  async listLinkedRegistrations(id: string): Promise<TransformedList<Record<string, unknown>>> {
    return super.list<Record<string, unknown>>(`collections/${id}/linked_registrations/`);
  }

  /**
   * Link a node to a collection
   *
   * @param id - The unique identifier of the collection
   * @param nodeId - The unique identifier of the node to link
   * @throws {OsfPermissionError} If user lacks write access to the collection
   */
  async addLinkedNode(id: string, nodeId: string): Promise<void> {
    const payload = {
      data: [{ type: 'linked_nodes', id: nodeId }],
    };
    await this.httpClient.post(`collections/${id}/linked_nodes/relationships/`, payload);
  }

  /**
   * Remove a linked node from a collection
   *
   * @param id - The unique identifier of the collection
   * @param nodeId - The unique identifier of the node to unlink
   * @throws {OsfNotFoundError} If collection is not found
   * @throws {OsfPermissionError} If user lacks write access to the collection
   */
  async removeLinkedNode(id: string, nodeId: string): Promise<void> {
    const payload = {
      data: [{ type: 'linked_nodes', id: nodeId }],
    };
    await this.httpClient.delete(`collections/${id}/linked_nodes/relationships/`, {
      body: JSON.stringify(payload),
    });
  }
}
