import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfLicenseAttributes, LicenseListParams } from '../types/license';

/**
 * Licenses resource class for interacting with OSF license endpoints
 *
 * Licenses describe the terms under which content on the OSF is shared.
 * Each license may have required fields (e.g., year, copyrightHolders).
 *
 * @example
 * ```typescript
 * const licenses = new Licenses(httpClient);
 *
 * // Get a license by ID
 * const license = await licenses.getById('563c1cf88c5e4a3877f9e968');
 *
 * // List all licenses
 * const allLicenses = await licenses.listLicenses();
 * ```
 */
export class Licenses extends BaseResource {
  /**
   * Get a license by its ID
   *
   * @param id - The unique identifier of the license
   * @returns The license resource
   * @throws {OsfNotFoundError} If license is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfLicenseAttributes>> {
    return super.get<OsfLicenseAttributes>(`license/${id}/`);
  }

  /**
   * List available licenses
   *
   * Returns a paginated list of licenses sorted by name.
   * Can be filtered by id or name.
   *
   * @param params - Optional filter and pagination parameters
   * @returns List of licenses
   */
  async listLicenses(params?: LicenseListParams): Promise<TransformedList<OsfLicenseAttributes>> {
    return super.list<OsfLicenseAttributes>('licenses/', params);
  }

  /**
   * List licenses with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listLicensesPaginated(params?: LicenseListParams): Promise<PaginatedResult<OsfLicenseAttributes>> {
    return super.listPaginated<OsfLicenseAttributes>('licenses/', params);
  }
}
