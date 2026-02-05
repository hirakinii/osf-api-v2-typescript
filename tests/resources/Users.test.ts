import { Users } from '../../src/resources/Users';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfAuthenticationError, OsfNotFoundError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfUserAttributes } from '../../src/types/user';
import fetchMock from 'jest-fetch-mock';

describe('Users', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let users: Users;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        users = new Users(httpClient);
    });

    describe('me()', () => {
        it('should fetch current authenticated user', async () => {
            const mockResponse: JsonApiResponse<OsfUserAttributes> = {
                data: {
                    id: 'user-me-123',
                    type: 'users',
                    attributes: {
                        full_name: 'Test User',
                        given_name: 'Test',
                        middle_names: '',
                        family_name: 'User',
                        suffix: '',
                        date_registered: '2024-01-01T00:00:00.000000',
                        active: true,
                    },
                    links: {
                        self: 'https://api.osf.io/v2/users/user-me-123/',
                        html: 'https://osf.io/user-me-123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.me();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/users/me/');

            expect(result.id).toBe('user-me-123');
            expect(result.type).toBe('users');
            expect(result.full_name).toBe('Test User');
            expect(result.given_name).toBe('Test');
            expect(result.family_name).toBe('User');
            expect(result.active).toBe(true);
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfUserAttributes> = {
                data: {
                    id: 'user-456',
                    type: 'users',
                    attributes: {
                        full_name: 'Jane Doe',
                        given_name: 'Jane',
                        middle_names: 'Marie',
                        family_name: 'Doe',
                        suffix: 'PhD',
                        date_registered: '2023-06-15T12:00:00.000000',
                        active: true,
                        timezone: 'America/New_York',
                        locale: 'en_US',
                    },
                    relationships: {
                        nodes: { links: { related: { href: 'https://api.osf.io/v2/users/user-456/nodes/' } } },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/users/user-456/',
                        html: 'https://osf.io/user-456/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.me();

            // Attributes should be flattened to top level
            expect(result.full_name).toBe('Jane Doe');
            expect(result.middle_names).toBe('Marie');
            expect(result.suffix).toBe('PhD');
            expect(result.timezone).toBe('America/New_York');
            expect(result.locale).toBe('en_US');
            // Relationships should be preserved
            expect(result.relationships).toBeDefined();
            expect(result.relationships?.nodes).toBeDefined();
        });

        it('should throw OsfAuthenticationError when not authenticated', async () => {
            fetchMock.mockResponseOnce(
                JSON.stringify({ errors: [{ detail: 'Authentication credentials were not provided.' }] }),
                { status: 401 }
            );

            await expect(users.me()).rejects.toThrow(OsfAuthenticationError);
        });
    });

    describe('getById(id)', () => {
        it('should fetch user by ID', async () => {
            const mockResponse: JsonApiResponse<OsfUserAttributes> = {
                data: {
                    id: 'abc12',
                    type: 'users',
                    attributes: {
                        full_name: 'John Smith',
                        given_name: 'John',
                        middle_names: '',
                        family_name: 'Smith',
                        suffix: '',
                        date_registered: '2022-03-20T08:30:00.000000',
                        active: true,
                    },
                    links: {
                        self: 'https://api.osf.io/v2/users/abc12/',
                        html: 'https://osf.io/abc12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.getById('abc12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/users/abc12/');

            expect(result.id).toBe('abc12');
            expect(result.full_name).toBe('John Smith');
        });

        it('should throw OsfNotFoundError for non-existent user', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(users.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should handle user with relationships', async () => {
            const mockResponse: JsonApiResponse<OsfUserAttributes> = {
                data: {
                    id: 'user-with-relations',
                    type: 'users',
                    attributes: {
                        full_name: 'Related User',
                        given_name: 'Related',
                        middle_names: '',
                        family_name: 'User',
                        suffix: '',
                        date_registered: '2021-01-01T00:00:00.000000',
                        active: true,
                    },
                    relationships: {
                        nodes: { links: { related: { href: 'https://api.osf.io/v2/users/user-with-relations/nodes/' } } },
                        institutions: {
                            links: { related: { href: 'https://api.osf.io/v2/users/user-with-relations/institutions/' } },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/users/user-with-relations/',
                        html: 'https://osf.io/user-with-relations/',
                        profile_image: 'https://osf.io/profile/user-with-relations/image.png',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.getById('user-with-relations');

            expect(result.relationships?.nodes).toBeDefined();
            expect(result.relationships?.institutions).toBeDefined();
            expect(result.links?.profile_image).toBe('https://osf.io/profile/user-with-relations/image.png');
        });
    });

    describe('listUsers(params)', () => {
        it('should fetch paginated list of users', async () => {
            const mockResponse: JsonApiListResponse<OsfUserAttributes> = {
                data: [
                    {
                        id: 'user-1',
                        type: 'users',
                        attributes: {
                            full_name: 'User One',
                            given_name: 'User',
                            middle_names: '',
                            family_name: 'One',
                            suffix: '',
                            date_registered: '2024-01-01T00:00:00.000000',
                            active: true,
                        },
                    },
                    {
                        id: 'user-2',
                        type: 'users',
                        attributes: {
                            full_name: 'User Two',
                            given_name: 'User',
                            middle_names: '',
                            family_name: 'Two',
                            suffix: '',
                            date_registered: '2024-01-02T00:00:00.000000',
                            active: true,
                        },
                    },
                ],
                meta: {
                    total: 100,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/users/',
                    first: 'https://api.osf.io/v2/users/?page=1',
                    last: 'https://api.osf.io/v2/users/?page=10',
                    next: 'https://api.osf.io/v2/users/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.listUsers();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/users/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].full_name).toBe('User One');
            expect(result.data[1].full_name).toBe('User Two');
            expect(result.meta?.total).toBe(100);
            expect(result.links?.next).toBe('https://api.osf.io/v2/users/?page=2');
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfUserAttributes> = {
                data: [
                    {
                        id: 'filtered-user',
                        type: 'users',
                        attributes: {
                            full_name: 'Filtered User',
                            given_name: 'Filtered',
                            middle_names: '',
                            family_name: 'User',
                            suffix: '',
                            date_registered: '2024-01-01T00:00:00.000000',
                            active: true,
                        },
                    },
                ],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await users.listUsers({ 'filter[family_name]': 'User' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bfamily_name%5D=User');
        });

        it('should preserve pagination links', async () => {
            const mockResponse: JsonApiListResponse<OsfUserAttributes> = {
                data: [],
                meta: { total: 50, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/users/?page=3',
                    first: 'https://api.osf.io/v2/users/?page=1',
                    last: 'https://api.osf.io/v2/users/?page=5',
                    prev: 'https://api.osf.io/v2/users/?page=2',
                    next: 'https://api.osf.io/v2/users/?page=4',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.listUsers({ page: 3 });

            expect(result.links?.prev).toBe('https://api.osf.io/v2/users/?page=2');
            expect(result.links?.next).toBe('https://api.osf.io/v2/users/?page=4');
            expect(result.links?.first).toBe('https://api.osf.io/v2/users/?page=1');
            expect(result.links?.last).toBe('https://api.osf.io/v2/users/?page=5');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfUserAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await users.listUsers({ 'filter[full_name]': 'NonExistentUser' });

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });
});
