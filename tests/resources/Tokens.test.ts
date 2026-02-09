import { Tokens } from '../../src/resources/Tokens';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfTokenAttributes } from '../../src/types/token';
import { OsfScopeAttributes } from '../../src/types/scope';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal token attributes object */
function buildTokenAttributes(overrides: Partial<OsfTokenAttributes> = {}): OsfTokenAttributes {
    return {
        name: 'My API Token',
        date_created: '2024-03-14T15:00:00Z',
        ...overrides,
    };
}

describe('Tokens', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let tokens: Tokens;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        tokens = new Tokens(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch token by ID', async () => {
            const mockResponse: JsonApiResponse<OsfTokenAttributes> = {
                data: {
                    id: 'token123',
                    type: 'tokens',
                    attributes: buildTokenAttributes({
                        name: 'Test Token',
                    }),
                    relationships: {
                        scopes: {
                            links: {
                                related: 'https://api.osf.io/v2/tokens/token123/scopes/',
                            },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/tokens/token123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await tokens.getById('token123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/tokens/token123/');

            expect(result.id).toBe('token123');
            expect(result.type).toBe('tokens');
            expect(result.name).toBe('Test Token');
            expect(result.date_created).toBe('2024-03-14T15:00:00Z');
        });

        it('should throw OsfNotFoundError for non-existent token', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(tokens.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(tokens.getById('private-token')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listTokens(params)', () => {
        it('should fetch a list of tokens', async () => {
            const mockResponse: JsonApiListResponse<OsfTokenAttributes> = {
                data: [
                    {
                        id: 'token1',
                        type: 'tokens',
                        attributes: buildTokenAttributes({ name: 'Token One' }),
                    },
                    {
                        id: 'token2',
                        type: 'tokens',
                        attributes: buildTokenAttributes({ name: 'Token Two' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/tokens/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await tokens.listTokens();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/tokens/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Token One');
            expect(result.data[1].name).toBe('Token Two');
            expect(result.meta?.total).toBe(2);
        });

        it('should support pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfTokenAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await tokens.listTokens({ page: 2 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=2');
        });

        it('should handle empty token list', async () => {
            const mockResponse: JsonApiListResponse<OsfTokenAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await tokens.listTokens();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listTokensPaginated(params)', () => {
        it('should return paginated result for tokens', async () => {
            const mockResponse: JsonApiListResponse<OsfTokenAttributes> = {
                data: [
                    {
                        id: 'token1',
                        type: 'tokens',
                        attributes: buildTokenAttributes({ name: 'Paginated Token' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/tokens/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await tokens.listTokensPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/tokens/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Paginated Token');
        });

        it('should support pagination parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfTokenAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await tokens.listTokensPaginated({ page: 3 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=3');
        });
    });

    describe('create(data)', () => {
        it('should create a new token with scopes', async () => {
            const mockResponse: JsonApiResponse<OsfTokenAttributes> = {
                data: {
                    id: 'new-token',
                    type: 'tokens',
                    attributes: buildTokenAttributes({
                        name: 'New Token',
                        token_id: 'generated-secret-token-value',
                    }),
                    relationships: {
                        scopes: {
                            links: {
                                related: 'https://api.osf.io/v2/tokens/new-token/scopes/',
                            },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/tokens/new-token/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await tokens.create({
                name: 'New Token',
                scopes: ['osf.full_write', 'osf.nodes.read'],
            });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/tokens/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('tokens');
            expect(body.data.attributes.name).toBe('New Token');
            expect(body.data.relationships.scopes.data).toEqual([
                { type: 'scopes', id: 'osf.full_write' },
                { type: 'scopes', id: 'osf.nodes.read' },
            ]);

            expect(result.id).toBe('new-token');
            expect(result.name).toBe('New Token');
            expect(result.token_id).toBe('generated-secret-token-value');
        });

        it('should throw OsfPermissionError without permission', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(
                tokens.create({ name: 'Unauthorized', scopes: ['osf.full_write'] }),
            ).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('delete(id)', () => {
        it('should deactivate a token', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await tokens.delete('token123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/tokens/token123/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfNotFoundError for non-existent token', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(tokens.delete('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without permission', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(tokens.delete('no-access')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listScopes(id)', () => {
        it('should fetch scopes for a token', async () => {
            const mockResponse: JsonApiListResponse<OsfScopeAttributes> = {
                data: [
                    {
                        id: 'osf.full_write',
                        type: 'scopes',
                        attributes: { description: 'Full write access to the OSF.' },
                    },
                    {
                        id: 'osf.nodes.read',
                        type: 'scopes',
                        attributes: { description: 'Read access to OSF nodes.' },
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await tokens.listScopes('token123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/tokens/token123/scopes/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].description).toBe('Full write access to the OSF.');
            expect(result.data[1].description).toBe('Read access to OSF nodes.');
        });

        it('should throw OsfNotFoundError for non-existent token', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(tokens.listScopes('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
