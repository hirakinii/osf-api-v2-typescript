import { Files } from '../../src/resources/Files';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfFileAttributes, FileVersionAttributes, StorageProviderAttributes } from '../../src/types/file';
import { TransformedResource } from '../../src/adapter/JsonApiAdapter';
import fetchMock from 'jest-fetch-mock';

describe('Files', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let files: Files;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl, allowedHosts: ['files.osf.io'] });
        files = new Files(httpClient);
    });

    describe('getById(fileId)', () => {
        it('should fetch file metadata by ID', async () => {
            const mockResponse: JsonApiResponse<OsfFileAttributes> = {
                data: {
                    id: 'file-123',
                    type: 'files',
                    attributes: {
                        name: 'test-file.txt',
                        kind: 'file',
                        path: '/test-file.txt',
                        materialized_path: '/test-file.txt',
                        provider: 'osfstorage',
                        size: 1024,
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-02T00:00:00.000000',
                        current_user_can_comment: true,
                        delete_allowed: true,
                    },
                    links: {
                        self: 'https://api.osf.io/v2/files/file-123/',
                        info: 'https://api.osf.io/v2/files/file-123/',
                        download: 'https://files.osf.io/v1/resources/abc12/providers/osfstorage/file-123',
                        delete: 'https://files.osf.io/v1/resources/abc12/providers/osfstorage/file-123',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.getById('file-123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/files/file-123/');

            expect(result.id).toBe('file-123');
            expect(result.name).toBe('test-file.txt');
            expect(result.kind).toBe('file');
            expect(result.size).toBe(1024);
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfFileAttributes> = {
                data: {
                    id: 'file-456',
                    type: 'files',
                    attributes: {
                        name: 'document.pdf',
                        kind: 'file',
                        path: '/docs/document.pdf',
                        materialized_path: '/docs/document.pdf',
                        provider: 'osfstorage',
                        size: 2048,
                        current_version: 3,
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-02T00:00:00.000000',
                        current_user_can_comment: true,
                        delete_allowed: true,
                        extra: {
                            hashes: { md5: 'abc123', sha256: 'xyz789' },
                            downloads: 10,
                        },
                    },
                    relationships: {
                        versions: { links: { related: { href: 'https://api.osf.io/v2/files/file-456/versions/' } } },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/files/file-456/',
                        info: 'https://api.osf.io/v2/files/file-456/',
                        download: 'https://files.osf.io/v1/download/file-456',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.getById('file-456');

            expect(result.name).toBe('document.pdf');
            expect(result.current_version).toBe(3);
            expect(result.extra?.downloads).toBe(10);
            expect(result.relationships?.versions).toBeDefined();
        });

        it('should include Waterbutler links', async () => {
            const mockResponse: JsonApiResponse<OsfFileAttributes> = {
                data: {
                    id: 'file-with-links',
                    type: 'files',
                    attributes: {
                        name: 'test.txt',
                        kind: 'file',
                        path: '/test.txt',
                        materialized_path: '/test.txt',
                        provider: 'osfstorage',
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-02T00:00:00.000000',
                        current_user_can_comment: true,
                        delete_allowed: true,
                    },
                    links: {
                        self: 'https://api.osf.io/v2/files/file-with-links/',
                        info: 'https://api.osf.io/v2/files/file-with-links/',
                        download: 'https://files.osf.io/v1/download/file-with-links',
                        upload: 'https://files.osf.io/v1/upload/file-with-links',
                        delete: 'https://files.osf.io/v1/delete/file-with-links',
                        move: 'https://files.osf.io/v1/move/file-with-links',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.getById('file-with-links');

            expect(result.links?.download).toBe('https://files.osf.io/v1/download/file-with-links');
            expect(result.links?.upload).toBe('https://files.osf.io/v1/upload/file-with-links');
            expect(result.links?.delete).toBe('https://files.osf.io/v1/delete/file-with-links');
        });

        it('should throw OsfNotFoundError for non-existent file', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(files.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listVersions(fileId)', () => {
        it('should fetch paginated list of file versions', async () => {
            const mockResponse: JsonApiListResponse<FileVersionAttributes> = {
                data: [
                    {
                        id: 'version-1',
                        type: 'file_versions',
                        attributes: {
                            size: 1024,
                            content_type: 'text/plain',
                            date_created: '2024-01-01T00:00:00.000000',
                            modified: '2024-01-01T00:00:00.000000',
                        },
                    },
                    {
                        id: 'version-2',
                        type: 'file_versions',
                        attributes: {
                            size: 2048,
                            content_type: 'text/plain',
                            date_created: '2024-01-02T00:00:00.000000',
                            modified: '2024-01-02T00:00:00.000000',
                        },
                    },
                ],
                meta: { total: 2 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.listVersions('file-123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/files/file-123/versions/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].size).toBe(1024);
            expect(result.data[1].size).toBe(2048);
        });

        it('should handle file with single version', async () => {
            const mockResponse: JsonApiListResponse<FileVersionAttributes> = {
                data: [
                    {
                        id: 'version-1',
                        type: 'file_versions',
                        attributes: {
                            size: 512,
                            content_type: 'application/pdf',
                            date_created: '2024-01-01T00:00:00.000000',
                            modified: '2024-01-01T00:00:00.000000',
                        },
                    },
                ],
                meta: { total: 1 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.listVersions('single-version-file');

            expect(result.data).toHaveLength(1);
            expect(result.meta?.total).toBe(1);
        });
    });

    describe('listByNode(nodeId, provider)', () => {
        it('should list files in node for osfstorage provider', async () => {
            const mockResponse: JsonApiListResponse<OsfFileAttributes> = {
                data: [
                    {
                        id: 'file-1',
                        type: 'files',
                        attributes: {
                            name: 'file1.txt',
                            kind: 'file',
                            path: '/file1.txt',
                            materialized_path: '/file1.txt',
                            provider: 'osfstorage',
                            date_created: '2024-01-01T00:00:00.000000',
                            date_modified: '2024-01-02T00:00:00.000000',
                            current_user_can_comment: true,
                            delete_allowed: true,
                        },
                    },
                    {
                        id: 'folder-1',
                        type: 'files',
                        attributes: {
                            name: 'docs',
                            kind: 'folder',
                            path: '/docs/',
                            materialized_path: '/docs/',
                            provider: 'osfstorage',
                            date_created: '2024-01-01T00:00:00.000000',
                            date_modified: '2024-01-02T00:00:00.000000',
                            current_user_can_comment: true,
                            delete_allowed: true,
                        },
                    },
                ],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.listByNode('abc12', 'osfstorage');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/files/osfstorage/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].kind).toBe('file');
            expect(result.data[1].kind).toBe('folder');
        });

        it('should default to osfstorage provider', async () => {
            const mockResponse: JsonApiListResponse<OsfFileAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await files.listByNode('abc12');

            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/files/osfstorage/');
        });

        it('should handle empty folder', async () => {
            const mockResponse: JsonApiListResponse<OsfFileAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.listByNode('empty-node', 'osfstorage');

            expect(result.data).toHaveLength(0);
        });
    });

    describe('listProviders(nodeId)', () => {
        it('should list storage providers for a node', async () => {
            const mockResponse: JsonApiListResponse<StorageProviderAttributes> = {
                data: [
                    {
                        id: 'osfstorage',
                        type: 'files',
                        attributes: {
                            name: 'osfstorage',
                            kind: 'folder',
                            path: '/',
                            node: 'abc12',
                            provider: 'osfstorage',
                        },
                    },
                ],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await files.listProviders('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/files/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('osfstorage');
        });
    });

    describe('getDownloadUrl(file)', () => {
        it('should prefer upload URL over download URL', () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'file-123',
                type: 'files',
                name: 'test.txt',
                kind: 'file',
                path: '/test.txt',
                materialized_path: '/test.txt',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: true,
                links: {
                    self: 'https://api.osf.io/v2/files/file-123/',
                    info: 'https://api.osf.io/v2/files/file-123/',
                    upload: 'https://files.osf.io/v1/upload/file-123',
                    download: 'https://files.osf.io/v1/download/file-123',
                },
            };

            const url = files.getDownloadUrl(file);

            expect(url).toBe('https://files.osf.io/v1/upload/file-123');
        });

        it('should fallback to download URL if upload is not available', () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'file-456',
                type: 'files',
                name: 'document.pdf',
                kind: 'file',
                path: '/document.pdf',
                materialized_path: '/document.pdf',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: true,
                links: {
                    self: 'https://api.osf.io/v2/files/file-456/',
                    info: 'https://api.osf.io/v2/files/file-456/',
                    download: 'https://files.osf.io/v1/download/file-456',
                },
            };

            const url = files.getDownloadUrl(file);

            expect(url).toBe('https://files.osf.io/v1/download/file-456');
        });

        it('should return undefined if no download link', () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'folder-123',
                type: 'files',
                name: 'docs',
                kind: 'folder',
                path: '/docs/',
                materialized_path: '/docs/',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: true,
                links: {
                    self: 'https://api.osf.io/v2/files/folder-123/',
                    info: 'https://api.osf.io/v2/files/folder-123/',
                },
            };

            const url = files.getDownloadUrl(file);

            expect(url).toBeUndefined();
        });
    });

    describe('download(file)', () => {
        it('should fetch file content using upload URL', async () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'file-123',
                type: 'files',
                name: 'test.txt',
                kind: 'file',
                path: '/test.txt',
                materialized_path: '/test.txt',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: true,
                links: {
                    self: 'https://api.osf.io/v2/files/file-123/',
                    info: 'https://api.osf.io/v2/files/file-123/',
                    upload: 'https://files.osf.io/v1/upload/file-123',
                    download: 'https://files.osf.io/v1/download/file-123',
                },
            };

            fetchMock.mockResponseOnce('file content');

            const result = await files.download(file);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://files.osf.io/v1/upload/file-123');
            expect(result).toBeInstanceOf(ArrayBuffer);
        });

        it('should throw error if file has no download link', async () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'folder-123',
                type: 'files',
                name: 'docs',
                kind: 'folder',
                path: '/docs/',
                materialized_path: '/docs/',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: true,
                links: {
                    self: 'https://api.osf.io/v2/files/folder-123/',
                    info: 'https://api.osf.io/v2/files/folder-123/',
                },
            };

            await expect(files.download(file)).rejects.toThrow('File does not have a download link');
        });
    });

    describe('deleteFile(file)', () => {
        it('should delete file using Waterbutler link', async () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'file-123',
                type: 'files',
                name: 'test.txt',
                kind: 'file',
                path: '/test.txt',
                materialized_path: '/test.txt',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: true,
                links: {
                    self: 'https://api.osf.io/v2/files/file-123/',
                    info: 'https://api.osf.io/v2/files/file-123/',
                    delete: 'https://files.osf.io/v1/delete/file-123',
                },
            };

            fetchMock.mockResponseOnce('', { status: 204 });

            await files.deleteFile(file);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://files.osf.io/v1/delete/file-123');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw error if file has no delete link', async () => {
            const file: TransformedResource<OsfFileAttributes> = {
                id: 'file-no-delete',
                type: 'files',
                name: 'protected.txt',
                kind: 'file',
                path: '/protected.txt',
                materialized_path: '/protected.txt',
                provider: 'osfstorage',
                date_created: '2024-01-01T00:00:00.000000',
                date_modified: '2024-01-02T00:00:00.000000',
                current_user_can_comment: true,
                delete_allowed: false,
                links: {
                    self: 'https://api.osf.io/v2/files/file-no-delete/',
                    info: 'https://api.osf.io/v2/files/file-no-delete/',
                },
            };

            await expect(files.deleteFile(file)).rejects.toThrow('File does not have a delete link');
        });
    });
});
