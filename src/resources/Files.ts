import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { OsfFileAttributes, FileVersionAttributes, StorageProviderAttributes, FileListParams } from '../types/file';
import { PaginatedResult } from '../pagination/PaginatedResult';

/**
 * Files resource class for interacting with OSF file endpoints
 *
 * Files on the OSF can be files or folders. File operations like download,
 * upload, and delete use the Waterbutler API through links provided in
 * file metadata.
 *
 * @example
 * ```typescript
 * const files = new Files(httpClient);
 *
 * // Get file metadata
 * const file = await files.getById('file-123');
 *
 * // List files in a node
 * const fileList = await files.listByNode('abc12', 'osfstorage');
 *
 * // Download a file
 * const content = await files.download(file);
 *
 * // Delete a file
 * await files.deleteFile(file);
 * ```
 */
export class Files extends BaseResource {
  /**
   * Get file metadata by ID
   *
   * @param fileId - The unique identifier of the file
   * @returns The file resource with metadata and Waterbutler links
   * @throws {OsfNotFoundError} If file is not found
   */
  async getById(fileId: string): Promise<TransformedResource<OsfFileAttributes>> {
    return super.get<OsfFileAttributes>(`files/${fileId}/`);
  }

  /**
   * List file versions
   *
   * @param fileId - The unique identifier of the file
   * @returns Paginated list of file versions
   */
  async listVersions(fileId: string): Promise<TransformedList<FileVersionAttributes>> {
    return super.list<FileVersionAttributes>(`files/${fileId}/versions/`);
  }

  /**
   * List files in a node for a specific storage provider
   *
   * @param nodeId - The unique identifier of the node
   * @param provider - The storage provider (defaults to 'osfstorage')
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of files and folders
   */
  async listByNode(
    nodeId: string,
    provider: string = 'osfstorage',
    params?: FileListParams,
  ): Promise<TransformedList<OsfFileAttributes>> {
    return super.list<OsfFileAttributes>(`nodes/${nodeId}/files/${provider}/`, params);
  }

  /**
   * List files in a node with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param nodeId - The unique identifier of the node
   * @param provider - The storage provider (defaults to 'osfstorage')
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   *
   * @example
   * ```typescript
   * const result = await files.listByNodePaginated('abc12');
   *
   * // Iterate through all files
   * for await (const file of result.items()) {
   *   console.log(file.name);
   * }
   * ```
   */
  async listByNodePaginated(
    nodeId: string,
    provider: string = 'osfstorage',
    params?: FileListParams,
  ): Promise<PaginatedResult<OsfFileAttributes>> {
    return super.listPaginated<OsfFileAttributes>(`nodes/${nodeId}/files/${provider}/`, params);
  }

  /**
   * List storage providers for a node
   *
   * @param nodeId - The unique identifier of the node
   * @returns List of configured storage providers
   */
  async listProviders(nodeId: string): Promise<TransformedList<StorageProviderAttributes>> {
    return super.list<StorageProviderAttributes>(`nodes/${nodeId}/files/`);
  }

  /**
   * Get the download URL for a file
   *
   * This returns the Waterbutler URL that can be used to download the file.
   *
   * @param file - The file resource with links
   * @returns The download URL, or undefined if not available
   */
  getDownloadUrl(file: TransformedResource<OsfFileAttributes>): string | undefined {
    return file.links?.download;
  }

  /**
   * Download a file's content
   *
   * Uses the Waterbutler download link from file metadata.
   *
   * @param file - The file resource with links
   * @returns The file content as an ArrayBuffer
   * @throws {Error} If file does not have a download link
   */
  async download(file: TransformedResource<OsfFileAttributes>): Promise<ArrayBuffer> {
    const downloadUrl = file.links?.download;
    if (!downloadUrl) {
      throw new Error('File does not have a download link');
    }
    return this.httpClient.getRaw(downloadUrl);
  }

  /**
   * Delete a file
   *
   * Uses the Waterbutler delete link from file metadata.
   *
   * @param file - The file resource with links
   * @throws {Error} If file does not have a delete link
   */
  async deleteFile(file: TransformedResource<OsfFileAttributes>): Promise<void> {
    const deleteUrl = file.links?.delete;
    if (!deleteUrl) {
      throw new Error('File does not have a delete link');
    }
    await this.httpClient.delete(deleteUrl);
  }
}
