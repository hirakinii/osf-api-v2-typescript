import { Nodes } from '../../src/resources/Nodes';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfNodeAttributes, CreateNodeInput, UpdateNodeInput } from '../../src/types/node';
import fetchMock from 'jest-fetch-mock';

describe('Nodes', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let nodes: Nodes;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        nodes = new Nodes(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch node by ID', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'abc12',
                    type: 'nodes',
                    attributes: {
                        title: 'Test Project',
                        description: 'A test project',
                        category: 'project',
                        current_user_can_comment: true,
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-02T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: false,
                        registration: false,
                        collection: false,
                        tags: ['test', 'demo'],
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/abc12/',
                        html: 'https://osf.io/abc12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await nodes.getById('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/');

            expect(result.id).toBe('abc12');
            expect(result.type).toBe('nodes');
            expect(result.title).toBe('Test Project');
            expect(result.category).toBe('project');
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'node-456',
                    type: 'nodes',
                    attributes: {
                        title: 'Flattened Node',
                        description: 'Testing attribute flattening',
                        category: 'data',
                        current_user_can_comment: false,
                        current_user_permissions: ['read', 'write'],
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-02T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: true,
                        registration: false,
                        collection: false,
                        tags: [],
                    },
                    relationships: {
                        files: { links: { related: { href: 'https://api.osf.io/v2/nodes/node-456/files/' } } },
                        contributors: {
                            links: { related: { href: 'https://api.osf.io/v2/nodes/node-456/contributors/' } },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/node-456/',
                        html: 'https://osf.io/node-456/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await nodes.getById('node-456');

            // Attributes should be flattened
            expect(result.title).toBe('Flattened Node');
            expect(result.public).toBe(true);
            expect(result.current_user_permissions).toEqual(['read', 'write']);
            // Relationships should be preserved
            expect(result.relationships?.files).toBeDefined();
            expect(result.relationships?.contributors).toBeDefined();
        });

        it('should throw OsfNotFoundError for non-existent node', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(nodes.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for private node without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(nodes.getById('private-node')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listNodes(params)', () => {
        it('should fetch paginated list of nodes', async () => {
            const mockResponse: JsonApiListResponse<OsfNodeAttributes> = {
                data: [
                    {
                        id: 'node-1',
                        type: 'nodes',
                        attributes: {
                            title: 'Node One',
                            description: 'First node',
                            category: 'project',
                            current_user_can_comment: true,
                            date_created: '2024-01-01T00:00:00.000000',
                            date_modified: '2024-01-02T00:00:00.000000',
                            fork: false,
                            preprint: false,
                            public: true,
                            registration: false,
                            collection: false,
                            tags: [],
                        },
                    },
                    {
                        id: 'node-2',
                        type: 'nodes',
                        attributes: {
                            title: 'Node Two',
                            description: 'Second node',
                            category: 'data',
                            current_user_can_comment: true,
                            date_created: '2024-01-03T00:00:00.000000',
                            date_modified: '2024-01-04T00:00:00.000000',
                            fork: false,
                            preprint: false,
                            public: true,
                            registration: false,
                            collection: false,
                            tags: ['research'],
                        },
                    },
                ],
                meta: {
                    total: 100,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/nodes/',
                    first: 'https://api.osf.io/v2/nodes/?page=1',
                    last: 'https://api.osf.io/v2/nodes/?page=10',
                    next: 'https://api.osf.io/v2/nodes/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await nodes.listNodes();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Node One');
            expect(result.data[1].title).toBe('Node Two');
            expect(result.meta?.total).toBe(100);
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfNodeAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await nodes.listNodes({ 'filter[title]': 'test', 'filter[public]': true });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btitle%5D=test');
            expect(url).toContain('filter%5Bpublic%5D=true');
        });

        it('should apply pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfNodeAttributes> = {
                data: [],
                meta: { total: 100, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/?page=5',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await nodes.listNodes({ page: 5 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=5');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfNodeAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await nodes.listNodes({ 'filter[title]': 'nonexistent' });

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('create(data)', () => {
        it('should create node with required fields (title, category)', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'new-node-123',
                    type: 'nodes',
                    attributes: {
                        title: 'New Project',
                        description: '',
                        category: 'project',
                        current_user_can_comment: true,
                        date_created: '2024-01-10T00:00:00.000000',
                        date_modified: '2024-01-10T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: false,
                        registration: false,
                        collection: false,
                        tags: [],
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/new-node-123/',
                        html: 'https://osf.io/new-node-123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreateNodeInput = {
                title: 'New Project',
                category: 'project',
            };

            const result = await nodes.create(input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('nodes');
            expect(body.data.attributes.title).toBe('New Project');
            expect(body.data.attributes.category).toBe('project');

            expect(result.id).toBe('new-node-123');
            expect(result.title).toBe('New Project');
        });

        it('should create node with optional fields', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'full-node',
                    type: 'nodes',
                    attributes: {
                        title: 'Full Project',
                        description: 'A detailed description',
                        category: 'software',
                        current_user_can_comment: true,
                        date_created: '2024-01-10T00:00:00.000000',
                        date_modified: '2024-01-10T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: true,
                        registration: false,
                        collection: false,
                        tags: ['typescript', 'api'],
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/full-node/',
                        html: 'https://osf.io/full-node/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreateNodeInput = {
                title: 'Full Project',
                category: 'software',
                description: 'A detailed description',
                public: true,
                tags: ['typescript', 'api'],
            };

            const result = await nodes.create(input);

            const [, options] = fetchMock.mock.calls[0];
            const body = JSON.parse(options?.body as string);
            expect(body.data.attributes.description).toBe('A detailed description');
            expect(body.data.attributes.public).toBe(true);
            expect(body.data.attributes.tags).toEqual(['typescript', 'api']);

            expect(result.public).toBe(true);
            expect(result.tags).toEqual(['typescript', 'api']);
        });

        it('should default to private visibility', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'private-node',
                    type: 'nodes',
                    attributes: {
                        title: 'Private Project',
                        description: '',
                        category: 'project',
                        current_user_can_comment: true,
                        date_created: '2024-01-10T00:00:00.000000',
                        date_modified: '2024-01-10T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: false,
                        registration: false,
                        collection: false,
                        tags: [],
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/private-node/',
                        html: 'https://osf.io/private-node/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await nodes.create({ title: 'Private Project', category: 'project' });

            expect(result.public).toBe(false);
        });
    });

    describe('update(id, data)', () => {
        it('should update node title', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'abc12',
                    type: 'nodes',
                    attributes: {
                        title: 'Updated Title',
                        description: 'Original description',
                        category: 'project',
                        current_user_can_comment: true,
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-15T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: false,
                        registration: false,
                        collection: false,
                        tags: [],
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/abc12/',
                        html: 'https://osf.io/abc12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdateNodeInput = { title: 'Updated Title' };
            const result = await nodes.update('abc12', input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/');
            expect(options?.method).toBe('PATCH');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('nodes');
            expect(body.data.id).toBe('abc12');
            expect(body.data.attributes.title).toBe('Updated Title');

            expect(result.title).toBe('Updated Title');
        });

        it('should update multiple fields', async () => {
            const mockResponse: JsonApiResponse<OsfNodeAttributes> = {
                data: {
                    id: 'abc12',
                    type: 'nodes',
                    attributes: {
                        title: 'Updated Node',
                        description: 'New description',
                        category: 'data',
                        current_user_can_comment: true,
                        date_created: '2024-01-01T00:00:00.000000',
                        date_modified: '2024-01-15T00:00:00.000000',
                        fork: false,
                        preprint: false,
                        public: true,
                        registration: false,
                        collection: false,
                        tags: ['updated'],
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/abc12/',
                        html: 'https://osf.io/abc12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdateNodeInput = {
                title: 'Updated Node',
                description: 'New description',
                category: 'data',
                public: true,
                tags: ['updated'],
            };
            const result = await nodes.update('abc12', input);

            expect(result.title).toBe('Updated Node');
            expect(result.description).toBe('New description');
            expect(result.category).toBe('data');
            expect(result.public).toBe(true);
        });

        it('should throw OsfNotFoundError for non-existent node', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(nodes.update('non-existent', { title: 'New' })).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(nodes.update('read-only-node', { title: 'New' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('delete(id)', () => {
        it('should delete node and return void', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await nodes.deleteNode('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfNotFoundError for non-existent node', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(nodes.deleteNode('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without admin access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(nodes.deleteNode('not-admin-node')).rejects.toThrow(OsfPermissionError);
        });
    });
});
