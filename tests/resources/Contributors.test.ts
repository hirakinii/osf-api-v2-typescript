import { Contributors } from '../../src/resources/Contributors';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import {
    OsfContributorAttributes,
    CreateContributorInput,
    UpdateContributorInput,
} from '../../src/types/contributor';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal contributor attributes object */
function buildContributorAttributes(
    overrides: Partial<OsfContributorAttributes> = {},
): OsfContributorAttributes {
    return {
        bibliographic: true,
        permission: 'write',
        index: 0,
        ...overrides,
    };
}

describe('Contributors', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let contributors: Contributors;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        contributors = new Contributors(httpClient);
    });

    describe('getByNodeAndUser(nodeId, userId)', () => {
        it('should fetch a specific contributor by node and user ID', async () => {
            const mockResponse: JsonApiResponse<OsfContributorAttributes> = {
                data: {
                    id: 'abc12-user1',
                    type: 'contributors',
                    attributes: buildContributorAttributes({
                        permission: 'admin',
                        bibliographic: true,
                        index: 0,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await contributors.getByNodeAndUser('abc12', 'user1');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/contributors/user1/');

            expect(result.id).toBe('abc12-user1');
            expect(result.type).toBe('contributors');
            expect(result.permission).toBe('admin');
            expect(result.bibliographic).toBe(true);
            expect(result.index).toBe(0);
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfContributorAttributes> = {
                data: {
                    id: 'abc12-user2',
                    type: 'contributors',
                    attributes: buildContributorAttributes({
                        permission: 'read',
                        bibliographic: false,
                        index: 2,
                        unregistered_contributor: 'Jane Doe',
                    }),
                    relationships: {
                        node: {
                            links: { related: { href: 'https://api.osf.io/v2/nodes/abc12/' } },
                        },
                        user: {
                            links: { related: { href: 'https://api.osf.io/v2/users/user2/' } },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/nodes/abc12/contributors/user2/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await contributors.getByNodeAndUser('abc12', 'user2');

            expect(result.permission).toBe('read');
            expect(result.bibliographic).toBe(false);
            expect(result.unregistered_contributor).toBe('Jane Doe');
            expect(result.relationships?.node).toBeDefined();
            expect(result.relationships?.user).toBeDefined();
        });

        it('should throw OsfNotFoundError for non-existent contributor', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(contributors.getByNodeAndUser('abc12', 'non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError when lacking access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(contributors.getByNodeAndUser('private-node', 'user1')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listByNode(nodeId, params)', () => {
        it('should fetch paginated list of contributors for a node', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [
                    {
                        id: 'abc12-user1',
                        type: 'contributors',
                        attributes: buildContributorAttributes({
                            permission: 'admin',
                            index: 0,
                        }),
                    },
                    {
                        id: 'abc12-user2',
                        type: 'contributors',
                        attributes: buildContributorAttributes({
                            permission: 'write',
                            index: 1,
                        }),
                    },
                ],
                meta: {
                    total: 2,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/nodes/abc12/contributors/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await contributors.listByNode('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/contributors/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].permission).toBe('admin');
            expect(result.data[1].permission).toBe('write');
            expect(result.meta?.total).toBe(2);
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await contributors.listByNode('abc12', {
                'filter[bibliographic]': true,
                'filter[permission]': 'admin',
            });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bbibliographic%5D=true');
            expect(url).toContain('filter%5Bpermission%5D=admin');
        });

        it('should apply pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [],
                meta: { total: 20, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await contributors.listByNode('abc12', { page: 2 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=2');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await contributors.listByNode('empty-node');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listByNodePaginated(nodeId, params)', () => {
        it('should return PaginatedResult for contributors', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [
                    {
                        id: 'abc12-user1',
                        type: 'contributors',
                        attributes: buildContributorAttributes({ permission: 'admin' }),
                    },
                ],
                meta: { total: 15, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/abc12/contributors/',
                    next: 'https://api.osf.io/v2/nodes/abc12/contributors/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await contributors.listByNodePaginated('abc12');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].permission).toBe('admin');
            expect(result.hasNext).toBe(true);
        });
    });

    describe('addToNode(nodeId, data)', () => {
        it('should add a contributor to a node', async () => {
            const mockResponse: JsonApiResponse<OsfContributorAttributes> = {
                data: {
                    id: 'abc12-newuser',
                    type: 'contributors',
                    attributes: buildContributorAttributes({
                        permission: 'write',
                        bibliographic: true,
                        index: 2,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreateContributorInput = {
                userId: 'newuser',
                permission: 'write',
                bibliographic: true,
            };
            const result = await contributors.addToNode('abc12', input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/contributors/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('contributors');
            expect(body.data.attributes.permission).toBe('write');
            expect(body.data.attributes.bibliographic).toBe(true);
            expect(body.data.relationships.user.data.type).toBe('users');
            expect(body.data.relationships.user.data.id).toBe('newuser');

            expect(result.id).toBe('abc12-newuser');
            expect(result.permission).toBe('write');
        });

        it('should add a contributor with default permission', async () => {
            const mockResponse: JsonApiResponse<OsfContributorAttributes> = {
                data: {
                    id: 'abc12-newuser',
                    type: 'contributors',
                    attributes: buildContributorAttributes({
                        permission: 'write',
                        index: 1,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreateContributorInput = {
                userId: 'newuser',
            };
            const result = await contributors.addToNode('abc12', input);

            const [, options] = fetchMock.mock.calls[0];
            const body = JSON.parse(options?.body as string);
            expect(body.data.relationships.user.data.id).toBe('newuser');

            expect(result.permission).toBe('write');
        });

        it('should throw OsfPermissionError when not admin', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(
                contributors.addToNode('abc12', { userId: 'newuser', permission: 'write' }),
            ).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('update(nodeId, userId, data)', () => {
        it('should update contributor permission', async () => {
            const mockResponse: JsonApiResponse<OsfContributorAttributes> = {
                data: {
                    id: 'abc12-user1',
                    type: 'contributors',
                    attributes: buildContributorAttributes({
                        permission: 'admin',
                        bibliographic: true,
                        index: 0,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdateContributorInput = { permission: 'admin' };
            const result = await contributors.update('abc12', 'user1', input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/contributors/user1/');
            expect(options?.method).toBe('PATCH');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('contributors');
            expect(body.data.id).toBe('abc12-user1');
            expect(body.data.attributes.permission).toBe('admin');

            expect(result.permission).toBe('admin');
        });

        it('should update contributor bibliographic status', async () => {
            const mockResponse: JsonApiResponse<OsfContributorAttributes> = {
                data: {
                    id: 'abc12-user1',
                    type: 'contributors',
                    attributes: buildContributorAttributes({
                        bibliographic: false,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdateContributorInput = { bibliographic: false };
            const result = await contributors.update('abc12', 'user1', input);

            const [, options] = fetchMock.mock.calls[0];
            const body = JSON.parse(options?.body as string);
            expect(body.data.attributes.bibliographic).toBe(false);

            expect(result.bibliographic).toBe(false);
        });

        it('should throw OsfNotFoundError for non-existent contributor', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(contributors.update('abc12', 'non-existent', { permission: 'read' })).rejects.toThrow(
                OsfNotFoundError,
            );
        });

        it('should throw OsfPermissionError without admin access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(contributors.update('abc12', 'user1', { permission: 'admin' })).rejects.toThrow(
                OsfPermissionError,
            );
        });
    });

    describe('removeFromNode(nodeId, userId)', () => {
        it('should remove a contributor from a node', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await contributors.removeFromNode('abc12', 'user1');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/contributors/user1/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfNotFoundError for non-existent contributor', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(contributors.removeFromNode('abc12', 'non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without admin access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(contributors.removeFromNode('abc12', 'user1')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listByRegistration(registrationId, params)', () => {
        it('should fetch contributors for a registration', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [
                    {
                        id: 'reg12-user1',
                        type: 'contributors',
                        attributes: buildContributorAttributes({
                            permission: 'admin',
                            index: 0,
                        }),
                    },
                    {
                        id: 'reg12-user2',
                        type: 'contributors',
                        attributes: buildContributorAttributes({
                            permission: 'read',
                            index: 1,
                        }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await contributors.listByRegistration('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/contributors/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].permission).toBe('admin');
            expect(result.data[1].permission).toBe('read');
        });

        it('should apply filter parameters for registration contributors', async () => {
            const mockResponse: JsonApiListResponse<OsfContributorAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await contributors.listByRegistration('reg12', { 'filter[bibliographic]': true });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bbibliographic%5D=true');
        });
    });
});
