import { Identifiers } from '../../src/resources/Identifiers';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfIdentifierAttributes } from '../../src/types/identifier';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal identifier attributes object */
function buildIdentifierAttributes(
    overrides: Partial<OsfIdentifierAttributes> = {},
): OsfIdentifierAttributes {
    return {
        category: 'doi',
        value: '10.17605/OSF.IO/ABC12',
        ...overrides,
    };
}

describe('Identifiers', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let identifiers: Identifiers;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        identifiers = new Identifiers(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch an identifier by ID', async () => {
            const mockResponse: JsonApiResponse<OsfIdentifierAttributes> = {
                data: {
                    id: '57f1641db83f6901ed94b45a',
                    type: 'identifiers',
                    attributes: buildIdentifierAttributes({
                        category: 'ark',
                        value: 'c7605/osf.io/73pnd',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/identifiers/57f1641db83f6901ed94b45a/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await identifiers.getById('57f1641db83f6901ed94b45a');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/identifiers/57f1641db83f6901ed94b45a/');

            expect(result.id).toBe('57f1641db83f6901ed94b45a');
            expect(result.type).toBe('identifiers');
            expect(result.category).toBe('ark');
            expect(result.value).toBe('c7605/osf.io/73pnd');
        });

        it('should throw OsfNotFoundError for non-existent identifier', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(identifiers.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(identifiers.getById('private-id')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listByNode(nodeId)', () => {
        it('should fetch identifiers for a node', async () => {
            const mockResponse: JsonApiListResponse<OsfIdentifierAttributes> = {
                data: [
                    {
                        id: 'id1',
                        type: 'identifiers',
                        attributes: buildIdentifierAttributes({ category: 'doi', value: '10.17605/OSF.IO/ABC12' }),
                    },
                    {
                        id: 'id2',
                        type: 'identifiers',
                        attributes: buildIdentifierAttributes({ category: 'ark', value: 'c7605/osf.io/abc12' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/abc12/identifiers/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await identifiers.listByNode('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/identifiers/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].category).toBe('doi');
            expect(result.data[0].value).toBe('10.17605/OSF.IO/ABC12');
            expect(result.data[1].category).toBe('ark');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter[category] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfIdentifierAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await identifiers.listByNode('abc12', { 'filter[category]': 'doi' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bcategory%5D=doi');
        });

        it('should handle empty identifiers list', async () => {
            const mockResponse: JsonApiListResponse<OsfIdentifierAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await identifiers.listByNode('abc12');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listByNodePaginated(nodeId)', () => {
        it('should return paginated result for node identifiers', async () => {
            const mockResponse: JsonApiListResponse<OsfIdentifierAttributes> = {
                data: [
                    {
                        id: 'id1',
                        type: 'identifiers',
                        attributes: buildIdentifierAttributes({ category: 'doi' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/abc12/identifiers/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await identifiers.listByNodePaginated('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/identifiers/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].category).toBe('doi');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfIdentifierAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await identifiers.listByNodePaginated('abc12', { 'filter[category]': 'ark' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bcategory%5D=ark');
        });
    });

    describe('listByRegistration(registrationId)', () => {
        it('should fetch identifiers for a registration', async () => {
            const mockResponse: JsonApiListResponse<OsfIdentifierAttributes> = {
                data: [
                    {
                        id: 'id1',
                        type: 'identifiers',
                        attributes: buildIdentifierAttributes({ category: 'doi', value: '10.17605/OSF.IO/REG12' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/registrations/reg12/identifiers/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await identifiers.listByRegistration('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/identifiers/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].value).toBe('10.17605/OSF.IO/REG12');
        });
    });
});
