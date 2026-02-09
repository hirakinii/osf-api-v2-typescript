import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfViewOnlyLinkAttributes } from '../types/view-only-link';
import { OsfNodeAttributes } from '../types/node';

/**
 * View Only Links resource class for interacting with OSF view-only link endpoints
 *
 * View only links allow sharing read-only access to private nodes
 * without requiring the viewer to have an OSF account.
 *
 * @example
 * ```typescript
 * const viewOnlyLinks = new ViewOnlyLinks(httpClient);
 *
 * // Get a view only link by ID
 * const vol = await viewOnlyLinks.getById('abc12');
 *
 * // List nodes accessible via a view only link
 * const nodes = await viewOnlyLinks.listNodes('abc12');
 * ```
 */
export class ViewOnlyLinks extends BaseResource {
  /**
   * Get a view only link by its ID
   *
   * @param id - The unique identifier of the view only link
   * @returns The view only link resource
   * @throws {OsfNotFoundError} If view only link is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async getById(id: string): Promise<TransformedResource<OsfViewOnlyLinkAttributes>> {
    return super.get<OsfViewOnlyLinkAttributes>(`view_only_links/${id}/`);
  }

  /**
   * List nodes accessible via a view only link
   *
   * @param linkId - The unique identifier of the view only link
   * @returns List of nodes accessible through this link
   * @throws {OsfNotFoundError} If view only link is not found
   * @throws {OsfPermissionError} If user lacks admin access
   */
  async listNodes(linkId: string): Promise<TransformedList<OsfNodeAttributes>> {
    return super.list<OsfNodeAttributes>(`view_only_links/${linkId}/nodes/`);
  }
}
