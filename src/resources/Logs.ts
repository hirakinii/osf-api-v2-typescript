import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfLogAttributes, LogListParams } from '../types/log';

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
  async listActions(): Promise<TransformedList<unknown>> {
    return super.list<unknown>('actions/');
  }
}
