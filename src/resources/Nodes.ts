import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfNodeAttributes, CreateNodeInput, UpdateNodeInput, NodeListParams } from '../types/node';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Nodes resource class for interacting with OSF node endpoints
 *
 * Nodes on the OSF represent projects and components.
 * - Projects are top-level nodes
 * - Components are child nodes of projects
 *
 * @example
 * ```typescript
 * const nodes = new Nodes(httpClient);
 *
 * // Get a node by ID
 * const node = await nodes.getById('abc12');
 *
 * // List nodes with filters
 * const nodeList = await nodes.listNodes({ 'filter[public]': true });
 *
 * // Create a new node
 * const newNode = await nodes.create({ title: 'My Project', category: 'project' });
 *
 * // Update a node
 * const updated = await nodes.update('abc12', { title: 'New Title' });
 *
 * // Delete a node
 * await nodes.deleteNode('abc12');
 * ```
 */
export class Nodes extends BaseResource {
  /**
   * Get a node by its ID
   *
   * @param id - The unique identifier of the node
   * @returns The node resource
   * @throws {OsfNotFoundError} If node is not found
   * @throws {OsfPermissionError} If user lacks read access to private node
   */
  async getById(id: string): Promise<TransformedResource<OsfNodeAttributes>> {
    return super.get<OsfNodeAttributes>(`nodes/${id}/`);
  }

  /**
   * List nodes with optional filtering and pagination
   *
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of nodes
   */
  async listNodes(params?: NodeListParams): Promise<TransformedList<OsfNodeAttributes>> {
    return super.list<OsfNodeAttributes>('nodes/', params);
  }

  /**
   * List nodes with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await nodes.listNodesPaginated({ 'filter[public]': true });
   *
   * // Iterate through all pages
   * for await (const page of result) {
   *   console.log(`Got ${page.length} nodes`);
   * }
   *
   * // Or iterate through all items
   * for await (const node of result.items()) {
   *   console.log(node.title);
   * }
   * ```
   */
  async listNodesPaginated(params?: NodeListParams): Promise<PaginatedResult<OsfNodeAttributes>> {
    return super.listPaginated<OsfNodeAttributes>('nodes/', params);
  }

  /**
   * Create a new node
   *
   * Nodes default to private unless explicitly set to public.
   *
   * @param data - Node creation input (title and category required)
   * @returns The created node resource
   */
  async create(data: CreateNodeInput): Promise<TransformedResource<OsfNodeAttributes>> {
    const payload = {
      data: {
        type: 'nodes',
        attributes: data,
      },
    };
    return super.post<OsfNodeAttributes>('nodes/', payload);
  }

  /**
   * Update an existing node
   *
   * Only fields provided in the input will be updated.
   *
   * @param id - The unique identifier of the node
   * @param data - Fields to update
   * @returns The updated node resource
   * @throws {OsfNotFoundError} If node is not found
   * @throws {OsfPermissionError} If user lacks write access
   */
  async update(id: string, data: UpdateNodeInput): Promise<TransformedResource<OsfNodeAttributes>> {
    const payload = {
      data: {
        type: 'nodes',
        id,
        attributes: data,
      },
    };
    return super.patch<OsfNodeAttributes>(`nodes/${id}/`, payload);
  }

  /**
   * Delete a node
   *
   * This action is permanent and cannot be undone.
   *
   * @param id - The unique identifier of the node
   * @throws {OsfNotFoundError} If node is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async deleteNode(id: string): Promise<void> {
    return super.remove(`nodes/${id}/`);
  }
}
