import { JsonApiAdapter } from '../../src/adapter/JsonApiAdapter';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';

describe('JsonApiAdapter', () => {
    let adapter: JsonApiAdapter;

    beforeEach(() => {
        adapter = new JsonApiAdapter();
    });

    describe('transformSingle', () => {
        it('should flatten attributes to top level', () => {
            const response: JsonApiResponse<{ title: string; description: string }> = {
                data: {
                    id: 'abc123',
                    type: 'nodes',
                    attributes: {
                        title: 'My Project',
                        description: 'A test project',
                    },
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.id).toBe('abc123');
            expect(result.type).toBe('nodes');
            expect(result.title).toBe('My Project');
            expect(result.description).toBe('A test project');
        });

        it('should preserve id and type fields', () => {
            const response: JsonApiResponse<{ name: string }> = {
                data: {
                    id: 'user-456',
                    type: 'users',
                    attributes: {
                        name: 'John Doe',
                    },
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.id).toBe('user-456');
            expect(result.type).toBe('users');
            expect(result.name).toBe('John Doe');
        });

        it('should organize relationships information', () => {
            const response: JsonApiResponse<{ title: string }> = {
                data: {
                    id: 'node-789',
                    type: 'nodes',
                    attributes: {
                        title: 'Test Node',
                    },
                    relationships: {
                        children: {
                            links: { related: { href: 'https://api.osf.io/v2/nodes/node-789/children/' } },
                        },
                        contributors: {
                            links: { related: { href: 'https://api.osf.io/v2/nodes/node-789/contributors/' } },
                        },
                    },
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.relationships).toBeDefined();
            expect(result.relationships?.children).toBeDefined();
            expect(result.relationships?.contributors).toBeDefined();
        });

        it('should preserve links', () => {
            const response: JsonApiResponse<{ title: string }> = {
                data: {
                    id: 'node-123',
                    type: 'nodes',
                    attributes: {
                        title: 'Test',
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/node-123/',
                        html: 'https://osf.io/node-123/',
                    },
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.links).toBeDefined();
            expect(result.links?.self).toBe('https://api.osf.io/v2/nodes/node-123/');
            expect(result.links?.html).toBe('https://osf.io/node-123/');
        });

        it('should handle empty attributes', () => {
            const response: JsonApiResponse<Record<string, never>> = {
                data: {
                    id: 'empty-001',
                    type: 'test',
                    attributes: {},
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.id).toBe('empty-001');
            expect(result.type).toBe('test');
        });

        it('should handle missing relationships', () => {
            const response: JsonApiResponse<{ title: string }> = {
                data: {
                    id: 'node-999',
                    type: 'nodes',
                    attributes: {
                        title: 'No Relationships',
                    },
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.id).toBe('node-999');
            expect(result.title).toBe('No Relationships');
            expect(result.relationships).toBeUndefined();
        });

        it('should handle nested relationships', () => {
            const response: JsonApiResponse<{ name: string }> = {
                data: {
                    id: 'complex-001',
                    type: 'complex',
                    attributes: {
                        name: 'Complex Resource',
                    },
                    relationships: {
                        parent: {
                            data: { id: 'parent-123', type: 'nodes' },
                            links: { related: { href: 'https://api.osf.io/v2/nodes/parent-123/' } },
                        },
                    },
                },
            };

            const result = adapter.transformSingle(response);

            expect(result.relationships?.parent).toBeDefined();
            expect(result.relationships?.parent).toHaveProperty('data');
            expect(result.relationships?.parent).toHaveProperty('links');
        });
    });

    describe('transformList', () => {
        it('should transform multiple data items', () => {
            const response: JsonApiListResponse<{ title: string }> = {
                data: [
                    {
                        id: 'node-1',
                        type: 'nodes',
                        attributes: { title: 'Project 1' },
                    },
                    {
                        id: 'node-2',
                        type: 'nodes',
                        attributes: { title: 'Project 2' },
                    },
                    {
                        id: 'node-3',
                        type: 'nodes',
                        attributes: { title: 'Project 3' },
                    },
                ],
            };

            const result = adapter.transformList(response);

            expect(result.data).toHaveLength(3);
            expect(result.data[0].id).toBe('node-1');
            expect(result.data[0].title).toBe('Project 1');
            expect(result.data[1].id).toBe('node-2');
            expect(result.data[1].title).toBe('Project 2');
            expect(result.data[2].id).toBe('node-3');
            expect(result.data[2].title).toBe('Project 3');
        });

        it('should preserve meta information', () => {
            const response: JsonApiListResponse<{ name: string }> = {
                data: [
                    {
                        id: 'user-1',
                        type: 'users',
                        attributes: { name: 'Alice' },
                    },
                ],
                meta: {
                    total: 100,
                    per_page: 10,
                    version: '2.0',
                },
            };

            const result = adapter.transformList(response);

            expect(result.meta).toBeDefined();
            expect(result.meta?.total).toBe(100);
            expect(result.meta?.per_page).toBe(10);
            expect(result.meta?.version).toBe('2.0');
        });

        it('should preserve pagination links', () => {
            const response: JsonApiListResponse<{ title: string }> = {
                data: [
                    {
                        id: 'node-1',
                        type: 'nodes',
                        attributes: { title: 'Page 1' },
                    },
                ],
                links: {
                    self: 'https://api.osf.io/v2/nodes/?page=1',
                    first: 'https://api.osf.io/v2/nodes/?page=1',
                    last: 'https://api.osf.io/v2/nodes/?page=10',
                    next: 'https://api.osf.io/v2/nodes/?page=2',
                },
            };

            const result = adapter.transformList(response);

            expect(result.links).toBeDefined();
            expect(result.links?.self).toBe('https://api.osf.io/v2/nodes/?page=1');
            expect(result.links?.first).toBe('https://api.osf.io/v2/nodes/?page=1');
            expect(result.links?.last).toBe('https://api.osf.io/v2/nodes/?page=10');
            expect(result.links?.next).toBe('https://api.osf.io/v2/nodes/?page=2');
        });

        it('should handle empty data array', () => {
            const response: JsonApiListResponse<{ title: string }> = {
                data: [],
            };

            const result = adapter.transformList(response);

            expect(result.data).toHaveLength(0);
            expect(result.data).toEqual([]);
        });

        it('should handle missing meta and links', () => {
            const response: JsonApiListResponse<{ name: string }> = {
                data: [
                    {
                        id: 'item-1',
                        type: 'items',
                        attributes: { name: 'Item 1' },
                    },
                ],
            };

            const result = adapter.transformList(response);

            expect(result.data).toHaveLength(1);
            expect(result.meta).toBeUndefined();
            expect(result.links).toBeUndefined();
        });
    });
});
