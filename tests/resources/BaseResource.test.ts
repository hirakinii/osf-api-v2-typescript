import { BaseResource } from '../../src/resources/BaseResource';
import { HttpClient } from '../../src/network/HttpClient';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import fetchMock from 'jest-fetch-mock';

// Create a concrete implementation for testing
class TestResource extends BaseResource {
    async getItem<T>(id: string) {
        return this.get<T>(`items/${id}`);
    }

    async listItems<T>(params?: Record<string, unknown>) {
        return this.list<T>('items', params);
    }
}

describe('BaseResource', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let resource: TestResource;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        resource = new TestResource(httpClient);
    });

    describe('constructor', () => {
        it('should hold HttpClient instance', () => {
            expect(resource['httpClient']).toBe(httpClient);
        });

        it('should instantiate JsonApiAdapter', () => {
            expect(resource['adapter']).toBeDefined();
        });
    });

    describe('get method', () => {
        it('should fetch single resource and transform it', async () => {
            const mockResponse: JsonApiResponse<{ name: string }> = {
                data: {
                    id: 'item-123',
                    type: 'items',
                    attributes: {
                        name: 'Test Item',
                    },
                    links: {
                        self: 'https://api.test-osf.io/v2/items/item-123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await resource.getItem<{ name: string }>('item-123');

            expect(result.id).toBe('item-123');
            expect(result.type).toBe('items');
            expect(result.name).toBe('Test Item');
            expect(result.links?.self).toBe('https://api.test-osf.io/v2/items/item-123/');
        });

        it('should handle 404 error for non-existent resource', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found' }] }), { status: 404 });

            await expect(resource.getItem<{ name: string }>('non-existent')).rejects.toThrow();
        });

        it('should transform response using adapter', async () => {
            const mockResponse: JsonApiResponse<{ title: string; description: string }> = {
                data: {
                    id: 'node-456',
                    type: 'nodes',
                    attributes: {
                        title: 'My Node',
                        description: 'Node description',
                    },
                    relationships: {
                        children: {
                            links: { related: { href: 'https://api.test-osf.io/v2/nodes/node-456/children/' } },
                        },
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await resource.getItem<{ title: string; description: string }>('node-456');

            // Verify attributes are flattened
            expect(result.title).toBe('My Node');
            expect(result.description).toBe('Node description');
            // Verify relationships are preserved
            expect(result.relationships).toBeDefined();
            expect(result.relationships?.children).toBeDefined();
        });
    });

    describe('list method', () => {
        it('should fetch list of resources and transform them', async () => {
            const mockResponse: JsonApiListResponse<{ name: string }> = {
                data: [
                    {
                        id: 'item-1',
                        type: 'items',
                        attributes: { name: 'Item 1' },
                    },
                    {
                        id: 'item-2',
                        type: 'items',
                        attributes: { name: 'Item 2' },
                    },
                ],
                meta: {
                    total: 2,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.test-osf.io/v2/items/',
                    first: 'https://api.test-osf.io/v2/items/?page=1',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await resource.listItems<{ name: string }>();

            expect(result.data).toHaveLength(2);
            expect(result.data[0].id).toBe('item-1');
            expect(result.data[0].name).toBe('Item 1');
            expect(result.data[1].id).toBe('item-2');
            expect(result.data[1].name).toBe('Item 2');
            expect(result.meta?.total).toBe(2);
            expect(result.links?.self).toBe('https://api.test-osf.io/v2/items/');
        });

        it('should handle query parameters correctly', async () => {
            const mockResponse: JsonApiListResponse<{ name: string }> = {
                data: [
                    {
                        id: 'filtered-1',
                        type: 'items',
                        attributes: { name: 'Filtered Item' },
                    },
                ],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const params = {
                filter: 'active',
                page: 2,
                sort: '-created',
            };

            await resource.listItems<{ name: string }>(params);

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter=active');
            expect(url).toContain('page=2');
            expect(url).toContain('sort=-created');
        });

        it('should preserve pagination information', async () => {
            const mockResponse: JsonApiListResponse<{ title: string }> = {
                data: [
                    {
                        id: 'node-1',
                        type: 'nodes',
                        attributes: { title: 'Node 1' },
                    },
                ],
                meta: {
                    total: 100,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.test-osf.io/v2/nodes/?page=1',
                    first: 'https://api.test-osf.io/v2/nodes/?page=1',
                    last: 'https://api.test-osf.io/v2/nodes/?page=10',
                    next: 'https://api.test-osf.io/v2/nodes/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await resource.listItems<{ title: string }>();

            expect(result.meta).toBeDefined();
            expect(result.meta?.total).toBe(100);
            expect(result.meta?.per_page).toBe(10);
            expect(result.links?.next).toBe('https://api.test-osf.io/v2/nodes/?page=2');
            expect(result.links?.last).toBe('https://api.test-osf.io/v2/nodes/?page=10');
        });

        it('should work without query parameters', async () => {
            const mockResponse: JsonApiListResponse<{ name: string }> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await resource.listItems<{ name: string }>();

            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/items');
        });

        it('should handle empty result list', async () => {
            const mockResponse: JsonApiListResponse<{ name: string }> = {
                data: [],
                meta: {
                    total: 0,
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await resource.listItems<{ name: string }>();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });
});
