import { CollectionProviders } from '../../src/resources/CollectionProviders';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfCollectionProviderAttributes } from '../../src/types/collection-provider';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal collection provider attributes object */
function buildProviderAttributes(
    overrides: Partial<OsfCollectionProviderAttributes> = {},
): OsfCollectionProviderAttributes {
    return {
        name: 'Test Lab',
        description: '<p>Test Description Data</p>',
        domain: '',
        domain_redirect_enabled: false,
        advisory_board: '',
        email_support: null,
        footer_links: '',
        facebook_app_id: null,
        allow_submissions: true,
        allow_commenting: false,
        example: null,
        assets: {},
        share_source: '',
        share_publish_type: 'Thesis',
        permissions: [],
        reviews_workflow: 'pre-moderation',
        ...overrides,
    };
}

describe('CollectionProviders', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let providers: CollectionProviders;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        providers = new CollectionProviders(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch collection provider by ID', async () => {
            const mockResponse: JsonApiResponse<OsfCollectionProviderAttributes> = {
                data: {
                    id: 'testlab',
                    type: 'collection-providers',
                    attributes: buildProviderAttributes(),
                    links: {
                        self: 'https://api.osf.io/v2/providers/collections/testlab/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.getById('testlab');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/providers/collections/testlab/');

            expect(result.id).toBe('testlab');
            expect(result.type).toBe('collection-providers');
            expect(result.name).toBe('Test Lab');
            expect(result.allow_submissions).toBe(true);
            expect(result.reviews_workflow).toBe('pre-moderation');
        });

        it('should throw OsfNotFoundError for non-existent provider', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(providers.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(providers.getById('private-provider')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listProviders(params)', () => {
        it('should fetch a list of collection providers', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionProviderAttributes> = {
                data: [
                    {
                        id: 'testlab',
                        type: 'collection-providers',
                        attributes: buildProviderAttributes(),
                    },
                    {
                        id: 'other',
                        type: 'collection-providers',
                        attributes: buildProviderAttributes({
                            name: 'Other Collection',
                            description: 'Another collection provider',
                        }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/providers/collections/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.listProviders();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/providers/collections/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Test Lab');
            expect(result.data[1].name).toBe('Other Collection');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter[name] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await providers.listProviders({ 'filter[name]': 'Test' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=Test');
        });

        it('should support filter[id] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await providers.listProviders({ 'filter[id]': 'testlab' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bid%5D=testlab');
        });

        it('should handle empty provider list', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.listProviders();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listProvidersPaginated(params)', () => {
        it('should return paginated result for collection providers', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionProviderAttributes> = {
                data: [
                    {
                        id: 'testlab',
                        type: 'collection-providers',
                        attributes: buildProviderAttributes(),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/providers/collections/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.listProvidersPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/providers/collections/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Test Lab');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await providers.listProvidersPaginated({ 'filter[name]': 'Test' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=Test');
        });
    });
});
