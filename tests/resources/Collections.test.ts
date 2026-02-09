import { Collections } from '../../src/resources/Collections';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfCollectionAttributes, CreateCollectionInput } from '../../src/types/collection';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal collection attributes object */
function buildCollectionAttributes(
    overrides: Partial<OsfCollectionAttributes> = {},
): OsfCollectionAttributes {
    return {
        title: 'Test Collection',
        date_created: '2024-01-01T00:00:00.000000',
        date_modified: '2024-01-02T00:00:00.000000',
        bookmarks: false,
        is_promoted: false,
        is_public: true,
        status_choices: [],
        collected_type_choices: [],
        volume_choices: [],
        issue_choices: [],
        program_area_choices: [],
        ...overrides,
    };
}

describe('Collections', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let collections: Collections;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        collections = new Collections(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch collection by ID', async () => {
            const mockResponse: JsonApiResponse<OsfCollectionAttributes> = {
                data: {
                    id: 'col12',
                    type: 'collections',
                    attributes: buildCollectionAttributes({
                        title: 'My Collection',
                        is_public: true,
                        status_choices: ['Proposed', 'Active'],
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/collections/col12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await collections.getById('col12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/col12/');

            expect(result.id).toBe('col12');
            expect(result.type).toBe('collections');
            expect(result.title).toBe('My Collection');
            expect(result.is_public).toBe(true);
            expect(result.status_choices).toEqual(['Proposed', 'Active']);
        });

        it('should throw OsfNotFoundError for non-existent collection', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(collections.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for private collection without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(collections.getById('private-col')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listCollections(params)', () => {
        it('should fetch paginated list of collections', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionAttributes> = {
                data: [
                    {
                        id: 'col-1',
                        type: 'collections',
                        attributes: buildCollectionAttributes({ title: 'Collection One' }),
                    },
                    {
                        id: 'col-2',
                        type: 'collections',
                        attributes: buildCollectionAttributes({ title: 'Collection Two' }),
                    },
                ],
                meta: {
                    total: 20,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/collections/',
                    first: 'https://api.osf.io/v2/collections/?page=1',
                    last: 'https://api.osf.io/v2/collections/?page=2',
                    next: 'https://api.osf.io/v2/collections/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await collections.listCollections();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Collection One');
            expect(result.data[1].title).toBe('Collection Two');
            expect(result.meta?.total).toBe(20);
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await collections.listCollections({
                'filter[title]': 'Science',
            });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btitle%5D=Science');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await collections.listCollections();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listCollectionsPaginated(params)', () => {
        it('should return PaginatedResult for collections', async () => {
            const mockResponse: JsonApiListResponse<OsfCollectionAttributes> = {
                data: [
                    {
                        id: 'col-1',
                        type: 'collections',
                        attributes: buildCollectionAttributes({ title: 'Paginated Collection 1' }),
                    },
                ],
                meta: { total: 20, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/collections/',
                    next: 'https://api.osf.io/v2/collections/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await collections.listCollectionsPaginated();

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Paginated Collection 1');
            expect(result.hasNext).toBe(true);
        });
    });

    describe('create(data)', () => {
        it('should create a new collection', async () => {
            const mockResponse: JsonApiResponse<OsfCollectionAttributes> = {
                data: {
                    id: 'new-col',
                    type: 'collections',
                    attributes: buildCollectionAttributes({
                        title: 'New Collection',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/collections/new-col/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreateCollectionInput = {
                title: 'New Collection',
            };
            const result = await collections.create(input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('collections');
            expect(body.data.attributes.title).toBe('New Collection');

            expect(result.id).toBe('new-col');
            expect(result.title).toBe('New Collection');
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(collections.create({ title: 'Unauthorized' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('delete(id)', () => {
        it('should delete a collection', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await collections.delete('col12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/col12/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfNotFoundError for non-existent collection', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(collections.delete('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(collections.delete('read-only-col')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listLinkedNodes(id)', () => {
        it('should fetch linked nodes for a collection', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'node-1',
                        type: 'nodes',
                        attributes: {
                            title: 'Linked Node 1',
                            category: 'project',
                        },
                    },
                    {
                        id: 'node-2',
                        type: 'nodes',
                        attributes: {
                            title: 'Linked Node 2',
                            category: 'project',
                        },
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await collections.listLinkedNodes('col12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/col12/linked_nodes/');

            expect(result.data).toHaveLength(2);
        });

        it('should throw OsfNotFoundError for non-existent collection', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(collections.listLinkedNodes('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listLinkedRegistrations(id)', () => {
        it('should fetch linked registrations for a collection', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'reg-1',
                        type: 'registrations',
                        attributes: {
                            title: 'Linked Registration 1',
                            registration_supplement: 'Open-Ended Registration',
                        },
                    },
                ],
                meta: { total: 1, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await collections.listLinkedRegistrations('col12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/col12/linked_registrations/');

            expect(result.data).toHaveLength(1);
        });
    });

    describe('addLinkedNode(id, nodeId)', () => {
        it('should link a node to a collection', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await collections.addLinkedNode('col12', 'node-abc');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/col12/linked_nodes/relationships/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data).toEqual([{ type: 'linked_nodes', id: 'node-abc' }]);
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(collections.addLinkedNode('col12', 'node-abc')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('removeLinkedNode(id, nodeId)', () => {
        it('should unlink a node from a collection', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await collections.removeLinkedNode('col12', 'node-abc');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/collections/col12/linked_nodes/relationships/');
            expect(options?.method).toBe('DELETE');

            const body = JSON.parse(options?.body as string);
            expect(body.data).toEqual([{ type: 'linked_nodes', id: 'node-abc' }]);
        });

        it('should throw OsfNotFoundError for non-existent collection', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(collections.removeLinkedNode('non-existent', 'node-abc')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
