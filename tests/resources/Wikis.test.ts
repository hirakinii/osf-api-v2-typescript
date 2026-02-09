import { Wikis } from '../../src/resources/Wikis';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfWikiAttributes, WikiVersionAttributes } from '../../src/types/wiki';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal wiki attributes object */
function buildWikiAttributes(
    overrides: Partial<OsfWikiAttributes> = {},
): OsfWikiAttributes {
    return {
        name: 'home',
        kind: 'file',
        date_modified: '2024-01-15T10:30:00.000000',
        content_type: 'text/markdown',
        path: '/home',
        materialized_path: '/home',
        size: 256,
        current_user_can_comment: true,
        extra: { version: 3 },
        ...overrides,
    };
}

/** Helper to build a minimal wiki version attributes object */
function buildWikiVersionAttributes(
    overrides: Partial<WikiVersionAttributes> = {},
): WikiVersionAttributes {
    return {
        date_created: '2024-03-10T12:00:00Z',
        size: 1024,
        content_type: 'text/markdown',
        ...overrides,
    };
}

describe('Wikis', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let wikis: Wikis;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        wikis = new Wikis(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch wiki by ID', async () => {
            const mockResponse: JsonApiResponse<OsfWikiAttributes> = {
                data: {
                    id: 'wiki123',
                    type: 'wikis',
                    attributes: buildWikiAttributes({
                        name: 'home',
                        size: 512,
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/wikis/wiki123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await wikis.getById('wiki123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/wikis/wiki123/');

            expect(result.id).toBe('wiki123');
            expect(result.type).toBe('wikis');
            expect(result.name).toBe('home');
            expect(result.size).toBe(512);
            expect(result.content_type).toBe('text/markdown');
        });

        it('should throw OsfNotFoundError for non-existent wiki', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(wikis.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for private wiki without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(wikis.getById('private-wiki')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('getContent(id)', () => {
        it('should fetch wiki content as plain text', async () => {
            const markdownContent = '# Welcome\n\nThis is the home wiki page.';
            fetchMock.mockResponseOnce(markdownContent);

            const result = await wikis.getContent('wiki123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/wikis/wiki123/content/');

            expect(result).toBe(markdownContent);
        });

        it('should throw OsfNotFoundError for non-existent wiki content', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(wikis.getContent('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listVersions(id)', () => {
        it('should fetch paginated list of wiki versions', async () => {
            const mockResponse: JsonApiListResponse<WikiVersionAttributes> = {
                data: [
                    {
                        id: '1',
                        type: 'wiki-versions',
                        attributes: buildWikiVersionAttributes({
                            date_created: '2024-01-01T00:00:00Z',
                            size: 100,
                        }),
                    },
                    {
                        id: '2',
                        type: 'wiki-versions',
                        attributes: buildWikiVersionAttributes({
                            date_created: '2024-02-01T00:00:00Z',
                            size: 200,
                        }),
                    },
                ],
                meta: {
                    total: 2,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/wikis/wiki123/versions/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await wikis.listVersions('wiki123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/wikis/wiki123/versions/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].size).toBe(100);
            expect(result.data[1].size).toBe(200);
            expect(result.meta?.total).toBe(2);
        });

        it('should handle empty version list', async () => {
            const mockResponse: JsonApiListResponse<WikiVersionAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await wikis.listVersions('wiki123');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });

        it('should throw OsfNotFoundError for non-existent wiki', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(wikis.listVersions('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('createVersion(id, content)', () => {
        it('should create a new wiki version', async () => {
            const mockResponse: JsonApiResponse<WikiVersionAttributes> = {
                data: {
                    id: '3',
                    type: 'wiki-versions',
                    attributes: buildWikiVersionAttributes({
                        date_created: '2024-03-15T12:00:00Z',
                        size: 512,
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/wikis/wiki123/versions/3/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await wikis.createVersion('wiki123', 'Updated wiki content');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/wikis/wiki123/versions/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('wiki-versions');
            expect(body.data.attributes.content).toBe('Updated wiki content');

            expect(result.id).toBe('3');
            expect(result.size).toBe(512);
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(wikis.createVersion('wiki123', 'content')).rejects.toThrow(OsfPermissionError);
        });

        it('should throw OsfNotFoundError for non-existent wiki', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(wikis.createVersion('non-existent', 'content')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
