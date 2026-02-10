import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfCommentAttributes, CreateCommentInput, UpdateCommentInput, CommentListParams } from '../types/comment';

/**
 * Comments resource class for interacting with OSF comment endpoints
 *
 * Comments allow discussions on OSF nodes (projects/components).
 * Users can create top-level comments or reply to existing comments.
 *
 * @example
 * ```typescript
 * const comments = new Comments(httpClient);
 *
 * // Get a comment by ID
 * const comment = await comments.getById('comment123');
 *
 * // List comments for a node
 * const nodeComments = await comments.listByNode('node123');
 *
 * // Create a comment on a node
 * const newComment = await comments.create('node123', { content: 'Great work!' });
 *
 * // Reply to a comment
 * const reply = await comments.create('node123', {
 *   content: 'Thanks!',
 *   target_id: 'comment123',
 *   target_type: 'comments',
 * });
 *
 * // Update a comment
 * const updated = await comments.update('comment123', { content: 'Updated text' });
 *
 * // Delete a comment
 * await comments.delete('comment123');
 * ```
 */
export class Comments extends BaseResource {
  /**
   * Get a comment by its ID
   *
   * @param id - The unique identifier of the comment
   * @returns The comment resource
   * @throws {OsfNotFoundError} If comment is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfCommentAttributes>> {
    return super.get<OsfCommentAttributes>(`comments/${id}/`);
  }

  /**
   * List all comments for a given node
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns List of comments
   * @throws {OsfNotFoundError} If node is not found
   */
  async listByNode(nodeId: string, params?: CommentListParams): Promise<TransformedList<OsfCommentAttributes>> {
    return super.list<OsfCommentAttributes>(`nodes/${nodeId}/comments/`, params);
  }

  /**
   * List comments for a node with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listByNodePaginated(
    nodeId: string,
    params?: CommentListParams,
  ): Promise<PaginatedResult<OsfCommentAttributes>> {
    return super.listPaginated<OsfCommentAttributes>(`nodes/${nodeId}/comments/`, params);
  }

  /**
   * Create a comment on a node
   *
   * To create a top-level comment, only `content` is required.
   * To reply to an existing comment, provide `target_id` and `target_type: 'comments'`.
   *
   * @param nodeId - The unique identifier of the node
   * @param data - Comment data including content and optional target
   * @returns The created comment resource
   * @throws {OsfPermissionError} If user lacks permission to comment
   */
  async create(nodeId: string, data: CreateCommentInput): Promise<TransformedResource<OsfCommentAttributes>> {
    const targetType = data.target_type ?? 'nodes';
    const targetId = data.target_id ?? nodeId;
    const payload = {
      data: {
        type: 'comments',
        attributes: {
          content: data.content,
        },
        relationships: {
          target: {
            data: {
              type: targetType,
              id: targetId,
            },
          },
        },
      },
    };
    return super.post<OsfCommentAttributes>(`nodes/${nodeId}/comments/`, payload);
  }

  /**
   * Update an existing comment
   *
   * Can be used to edit comment content or to undelete a comment
   * by setting `deleted: false`.
   *
   * @param id - The unique identifier of the comment
   * @param data - Fields to update
   * @returns The updated comment resource
   * @throws {OsfNotFoundError} If comment is not found
   * @throws {OsfPermissionError} If user lacks edit access
   */
  async update(id: string, data: UpdateCommentInput): Promise<TransformedResource<OsfCommentAttributes>> {
    const targetType = data.target_type ?? 'nodes';
    const payload = {
      data: {
        type: 'comments',
        id,
        attributes: {
          ...(data.content !== undefined && { content: data.content }),
          ...(data.deleted !== undefined && { deleted: data.deleted }),
        },
        relationships: {
          target: {
            data: {
              type: targetType,
              id: data.target_id,
            },
          },
        },
      },
    };
    return super.put<OsfCommentAttributes>(`comments/${id}/`, payload);
  }

  /**
   * Delete a comment
   *
   * This action can be undone by updating the comment with `deleted: false`.
   *
   * @param id - The unique identifier of the comment
   * @throws {OsfNotFoundError} If comment is not found
   * @throws {OsfPermissionError} If user lacks delete access
   */
  async delete(id: string): Promise<void> {
    return super.remove(`comments/${id}/`);
  }
}
