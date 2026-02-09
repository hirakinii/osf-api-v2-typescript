import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfWikiAttributes, WikiVersionAttributes } from '../types/wiki';

/**
 * Wikis resource class for interacting with OSF wiki endpoints
 *
 * Wikis are collaborative markdown documents attached to OSF projects.
 * Each wiki page maintains a version history for tracking changes.
 *
 * @example
 * ```typescript
 * const wikis = new Wikis(httpClient);
 *
 * // Get a wiki by ID
 * const wiki = await wikis.getById('wiki123');
 *
 * // Get wiki content as markdown text
 * const content = await wikis.getContent('wiki123');
 *
 * // List versions of a wiki
 * const versions = await wikis.listVersions('wiki123');
 *
 * // Create a new version
 * const newVersion = await wikis.createVersion('wiki123', '# Updated content');
 * ```
 */
export class Wikis extends BaseResource {
  /**
   * Get a wiki by its ID
   *
   * @param id - The unique identifier of the wiki
   * @returns The wiki resource
   * @throws {OsfNotFoundError} If wiki is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfWikiAttributes>> {
    return super.get<OsfWikiAttributes>(`wikis/${id}/`);
  }

  /**
   * Get the content of a wiki page as plain text (markdown)
   *
   * @param id - The unique identifier of the wiki
   * @returns The wiki content as a markdown string
   * @throws {OsfNotFoundError} If wiki is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getContent(id: string): Promise<string> {
    const buffer = await this.httpClient.getRaw(`wikis/${id}/content/`);
    return new TextDecoder().decode(buffer);
  }

  /**
   * List all versions of a wiki page
   *
   * @param id - The unique identifier of the wiki
   * @returns Paginated list of wiki versions
   * @throws {OsfNotFoundError} If wiki is not found
   */
  async listVersions(id: string): Promise<TransformedList<WikiVersionAttributes>> {
    return super.list<WikiVersionAttributes>(`wikis/${id}/versions/`);
  }

  /**
   * Create a new version of a wiki page
   *
   * @param id - The unique identifier of the wiki
   * @param content - The new content for the wiki page
   * @returns The created wiki version resource
   * @throws {OsfNotFoundError} If wiki is not found
   * @throws {OsfPermissionError} If user lacks write access
   */
  async createVersion(id: string, content: string): Promise<TransformedResource<WikiVersionAttributes>> {
    const payload = {
      data: {
        type: 'wiki-versions',
        attributes: { content },
      },
    };
    return super.post<WikiVersionAttributes>(`wikis/${id}/versions/`, payload);
  }
}
