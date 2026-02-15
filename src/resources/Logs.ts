import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfLogAttributes, LogListParams, OsfLogActionInfo } from '../types/log';

/**
 * Complete list of loggable actions supported by the OSF
 * 
 * Note: The OSF API v2 does not actually implement the /actions/ endpoint,
 * so this list is provided locally based on the API documentation.
 */
const LOG_ACTIONS: OsfLogActionInfo[] = [
  { identifier: 'project_created', description: 'A Node is created' },
  { identifier: 'project_registered', description: 'A Node is registered' },
  { identifier: 'project_deleted', description: 'A Node is deleted' },
  { identifier: 'created_from', description: 'A Node is created using an existing Node as a template' },
  { identifier: 'pointer_created', description: 'A Pointer is created' },
  { identifier: 'pointer_forked', description: 'A Pointer is forked' },
  { identifier: 'pointer_removed', description: 'A Pointer is removed' },
  { identifier: 'node_removed', description: 'A component is deleted' },
  { identifier: 'node_forked', description: 'A Node is forked' },
  { identifier: 'made_public', description: 'A Node is made public' },
  { identifier: 'made_private', description: 'A Node is made private' },
  { identifier: 'tag_added', description: 'A tag is added to a Node' },
  { identifier: 'tag_removed', description: 'A tag is removed from a Node' },
  { identifier: 'edit_title', description: "A Node's title is changed" },
  { identifier: 'edit_description', description: "A Node's description is changed" },
  { identifier: 'updated_fields', description: "One or more of a Node's fields are changed" },
  { identifier: 'external_ids_added', description: 'An external identifier is added to a Node (e.g. DOI, ARK)' },
  { identifier: 'view_only_link_added', description: 'A view-only link was added to a Node' },
  { identifier: 'view_only_link_removed', description: 'A view-only link was removed from a Node' },
  { identifier: 'contributor_added', description: 'A Contributor is added to a Node' },
  { identifier: 'contributor_removed', description: 'A Contributor is removed from a Node' },
  { identifier: 'contributors_reordered', description: "A Contributor's position in a Node's bibliography is changed" },
  { identifier: 'permissions_updated', description: "A Contributor's permissions on a Node are changed" },
  { identifier: 'made_contributor_visible', description: 'A Contributor is made bibliographically visible on a Node' },
  { identifier: 'made_contributor_invisible', description: 'A Contributor is made bibliographically invisible on a Node' },
  { identifier: 'wiki_updated', description: "A Node's wiki is updated" },
  { identifier: 'wiki_deleted', description: "A Node's wiki is deleted" },
  { identifier: 'wiki_renamed', description: "A Node's wiki is renamed" },
  { identifier: 'made_wiki_public', description: "A Node's wiki is made public" },
  { identifier: 'made_wiki_private', description: "A Node's wiki is made private" },
  { identifier: 'addon_added', description: 'An add-on is linked to a Node' },
  { identifier: 'addon_removed', description: 'An add-on is unlinked from a Node' },
  { identifier: 'addon_file_moved', description: "A File in a Node's linked add-on is moved" },
  { identifier: 'addon_file_copied', description: "A File in a Node's linked add-on is copied" },
  { identifier: 'addon_file_renamed', description: "A File in a Node's linked add-on is renamed" },
  { identifier: 'node_authorized', description: 'An addon is authorized for a project' },
  { identifier: 'node_deauthorized', description: 'An addon is deauthorized for a project' },
  { identifier: 'folder_created', description: "A Folder is created in a Node's linked add-on" },
  { identifier: 'file_added', description: "A File is added to a Node's linked add-on" },
  { identifier: 'file_updated', description: "A File is updated on a Node's linked add-on" },
  { identifier: 'file_removed', description: "A File is removed from a Node's linked add-on" },
  { identifier: 'file_restored', description: "A File is restored in a Node's linked add-on" },
  { identifier: 'comment_added', description: 'A Comment is added to some item' },
  { identifier: 'comment_removed', description: 'A Comment is removed from some item' },
  { identifier: 'comment_updated', description: 'A Comment is updated on some item' },
  { identifier: 'embargo_initiated', description: 'An embargoed Registration is proposed on a Node' },
  { identifier: 'embargo_approved', description: 'A proposed Embargo of a Node is approved' },
  { identifier: 'embargo_cancelled', description: 'A proposed Embargo of a Node is cancelled' },
  { identifier: 'embargo_completed', description: 'A proposed Embargo of a Node is completed' },
  { identifier: 'retraction_initiated', description: 'A Withdrawal of a Registration is proposed' },
  { identifier: 'retraction_approved', description: 'A Withdrawal of a Registration is approved' },
  { identifier: 'retraction_cancelled', description: 'A Withdrawal of a Registration is cancelled' },
  { identifier: 'registration_initiated', description: 'A Registration of a Node is proposed' },
  { identifier: 'registration_approved', description: 'A proposed Registration is approved' },
  { identifier: 'registration_cancelled', description: 'A proposed Registration is cancelled' },
];

/**
 * Logs resource class for interacting with OSF log endpoints
 *
 * Logs are permanent immutable records of a node's history.
 * A log is created when a user performs one of many actions.
 *
 * @example
 * ```typescript
 * const logs = new Logs(httpClient);
 *
 * // Get a log by ID
 * const log = await logs.getById('log123');
 *
 * // List logs for a node
 * const nodeLogs = await logs.listByNode('node123');
 *
 * // List logs with filtering
 * const filtered = await logs.listByNode('node123', { 'filter[action]': 'file_added' });
 *
 * // List available actions
 * const actions = await logs.listActions();
 * ```
 */
export class Logs extends BaseResource {
  /**
   * Get a log by its ID
   *
   * @param id - The unique identifier of the log
   * @returns The log resource
   * @throws {OsfNotFoundError} If log is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfLogAttributes>> {
    return super.get<OsfLogAttributes>(`logs/${id}/`);
  }

  /**
   * List all logs for a given node
   *
   * Returns logs sorted by date, with the most recent logs appearing first.
   * Includes logs of the specified node as well as logs of child nodes
   * to which the current user has read-only access.
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns List of logs
   * @throws {OsfNotFoundError} If node is not found
   */
  async listByNode(nodeId: string, params?: LogListParams): Promise<TransformedList<OsfLogAttributes>> {
    return super.list<OsfLogAttributes>(`nodes/${nodeId}/logs/`, params);
  }

  /**
   * List logs for a node with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param nodeId - The unique identifier of the node
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listByNodePaginated(nodeId: string, params?: LogListParams): Promise<PaginatedResult<OsfLogAttributes>> {
    return super.listPaginated<OsfLogAttributes>(`nodes/${nodeId}/logs/`, params);
  }

  /**
   * List all available log actions
   *
   * Returns the complete list of loggable actions supported by the OSF.
   *
   * @returns List of available actions
   */
  /**
   * List all available log actions
   *
   * Returns the complete list of loggable actions supported by the OSF.
   * 
   * Note: The OSF API v2 does not implement the /actions/ endpoint,
   * so this method returns a locally-defined list based on the API documentation.
   *
   * @returns Array of available actions with their identifiers and descriptions
   */
  async listActions(): Promise<OsfLogActionInfo[]> {
    return LOG_ACTIONS;
  }
}
