import { Logs } from '../../src/resources/Logs';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfLogAttributes } from '../../src/types/log';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal log attributes object */
function buildLogAttributes(
    overrides: Partial<OsfLogAttributes> = {},
): OsfLogAttributes {
    return {
        date: '2024-01-15T10:30:00.000000',
        action: 'project_created',
        params: {
            params_node: {
                id: 'abc12',
                title: 'Test Project',
            },
        },
        ...overrides,
    };
}

describe('Logs', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let logs: Logs;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        logs = new Logs(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch log by ID', async () => {
            const mockResponse: JsonApiResponse<OsfLogAttributes> = {
                data: {
                    id: 'log123',
                    type: 'logs',
                    attributes: buildLogAttributes({
                        action: 'contributor_added',
                        params: {
                            params_node: {
                                id: 'ezcuj',
                                title: 'Reproducibility Project',
                            },
                            contributors: [
                                {
                                    family_name: 'Nosek',
                                    given_name: 'Brian',
                                    full_name: 'Brian Nosek',
                                },
                            ],
                        },
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/logs/log123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await logs.getById('log123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/logs/log123/');

            expect(result.id).toBe('log123');
            expect(result.type).toBe('logs');
            expect(result.action).toBe('contributor_added');
            expect(result.date).toBe('2024-01-15T10:30:00.000000');
        });

        it('should throw OsfNotFoundError for non-existent log', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(logs.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for private log without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(logs.getById('private-log')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listByNode(nodeId)', () => {
        it('should fetch logs for a node', async () => {
            const mockResponse: JsonApiListResponse<OsfLogAttributes> = {
                data: [
                    {
                        id: 'log1',
                        type: 'logs',
                        attributes: buildLogAttributes({ action: 'project_created' }),
                    },
                    {
                        id: 'log2',
                        type: 'logs',
                        attributes: buildLogAttributes({ action: 'contributor_added' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/node123/logs/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await logs.listByNode('node123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/node123/logs/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].action).toBe('project_created');
            expect(result.data[1].action).toBe('contributor_added');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfLogAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await logs.listByNode('node123', { 'filter[action]': 'project_created' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Baction%5D=project_created');
        });

        it('should handle empty log list', async () => {
            const mockResponse: JsonApiListResponse<OsfLogAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await logs.listByNode('node123');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });

        it('should throw OsfNotFoundError for non-existent node', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(logs.listByNode('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listByNodePaginated(nodeId)', () => {
        it('should return paginated result for node logs', async () => {
            const mockResponse: JsonApiListResponse<OsfLogAttributes> = {
                data: [
                    {
                        id: 'log1',
                        type: 'logs',
                        attributes: buildLogAttributes({ action: 'made_public' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/node123/logs/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await logs.listByNodePaginated('node123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/node123/logs/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].action).toBe('made_public');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfLogAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await logs.listByNodePaginated('node123', { 'filter[action]': 'file_added' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Baction%5D=file_added');
        });
    });

    describe('listActions()', () => {
        it('should return the complete list of loggable actions', async () => {
            const actions = await logs.listActions();

            // Should not make any API calls (local data)
            expect(fetchMock).toHaveBeenCalledTimes(0);

            // Verify it returns an array
            expect(Array.isArray(actions)).toBe(true);
            
            // Verify all actions have identifier and description
            actions.forEach(action => {
                expect(action).toHaveProperty('identifier');
                expect(action).toHaveProperty('description');
                expect(typeof action.identifier).toBe('string');
                expect(typeof action.description).toBe('string');
            });

            // Verify some expected actions are present
            const identifiers = actions.map(a => a.identifier);
            expect(identifiers).toContain('project_created');
            expect(identifiers).toContain('file_added');
            expect(identifiers).toContain('comment_added');
            expect(identifiers).toContain('registration_approved');
            
            // Verify expected total count (55 actions according to API docs)
            expect(actions.length).toBe(55);
        });
    });
});
