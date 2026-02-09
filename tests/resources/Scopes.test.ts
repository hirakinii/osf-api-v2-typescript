import { Scopes } from '../../src/resources/Scopes';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfScopeAttributes } from '../../src/types/scope';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal scope attributes object */
function buildScopeAttributes(overrides: Partial<OsfScopeAttributes> = {}): OsfScopeAttributes {
    return {
        description: 'Read access to OSF nodes.',
        ...overrides,
    };
}

describe('Scopes', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let scopes: Scopes;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        scopes = new Scopes(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch scope by ID', async () => {
            const mockResponse: JsonApiResponse<OsfScopeAttributes> = {
                data: {
                    id: 'osf.nodes.read',
                    type: 'scopes',
                    attributes: buildScopeAttributes({
                        description: 'Read access to OSF nodes.',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/scopes/osf.nodes.read/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await scopes.getById('osf.nodes.read');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/scopes/osf.nodes.read/');

            expect(result.id).toBe('osf.nodes.read');
            expect(result.type).toBe('scopes');
            expect(result.description).toBe('Read access to OSF nodes.');
        });

        it('should throw OsfNotFoundError for non-existent scope', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(scopes.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listScopes(params)', () => {
        it('should fetch a list of scopes', async () => {
            const mockResponse: JsonApiListResponse<OsfScopeAttributes> = {
                data: [
                    {
                        id: 'osf.nodes.read',
                        type: 'scopes',
                        attributes: buildScopeAttributes({ description: 'Read access to OSF nodes.' }),
                    },
                    {
                        id: 'osf.full_write',
                        type: 'scopes',
                        attributes: buildScopeAttributes({ description: 'Full write access to the OSF.' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/scopes/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await scopes.listScopes();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/scopes/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].description).toBe('Read access to OSF nodes.');
            expect(result.data[1].description).toBe('Full write access to the OSF.');
            expect(result.meta?.total).toBe(2);
        });

        it('should handle empty scope list', async () => {
            const mockResponse: JsonApiListResponse<OsfScopeAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await scopes.listScopes();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });

        it('should support pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfScopeAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await scopes.listScopes({ page: 2 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=2');
        });
    });

    describe('listScopesPaginated(params)', () => {
        it('should return paginated result for scopes', async () => {
            const mockResponse: JsonApiListResponse<OsfScopeAttributes> = {
                data: [
                    {
                        id: 'osf.full_read',
                        type: 'scopes',
                        attributes: buildScopeAttributes({ description: 'Full read access.' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/scopes/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await scopes.listScopesPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/scopes/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].description).toBe('Full read access.');
        });

        it('should support pagination parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfScopeAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await scopes.listScopesPaginated({ page: 3 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=3');
        });
    });
});
