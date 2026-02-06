import { Registrations } from '../../src/resources/Registrations';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfRegistrationAttributes, UpdateRegistrationInput } from '../../src/types/registration';
import { OsfNodeAttributes } from '../../src/types/node';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal registration attributes object */
function buildRegistrationAttributes(
    overrides: Partial<OsfRegistrationAttributes> = {},
): OsfRegistrationAttributes {
    return {
        title: 'Test Registration',
        description: 'A test registration',
        category: 'project',
        current_user_can_comment: false,
        date_created: '2024-01-01T00:00:00.000000',
        date_modified: '2024-01-02T00:00:00.000000',
        date_registered: '2024-01-01T12:00:00.000000',
        fork: false,
        preprint: false,
        public: true,
        registration: true,
        collection: false,
        withdrawn: false,
        pending_embargo_approval: false,
        pending_registration_approval: false,
        pending_withdrawal: false,
        tags: [],
        ...overrides,
    };
}

describe('Registrations', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let registrations: Registrations;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        registrations = new Registrations(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch registration by ID', async () => {
            const mockResponse: JsonApiResponse<OsfRegistrationAttributes> = {
                data: {
                    id: 'reg12',
                    type: 'registrations',
                    attributes: buildRegistrationAttributes({
                        title: 'My Registration',
                        description: 'A study registration',
                        tags: ['open-science', 'badges'],
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/registrations/reg12/',
                        html: 'https://osf.io/reg12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.getById('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/');

            expect(result.id).toBe('reg12');
            expect(result.type).toBe('registrations');
            expect(result.title).toBe('My Registration');
            expect(result.registration).toBe(true);
            expect(result.tags).toEqual(['open-science', 'badges']);
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfRegistrationAttributes> = {
                data: {
                    id: 'reg-456',
                    type: 'registrations',
                    attributes: buildRegistrationAttributes({
                        title: 'Flattened Registration',
                        current_user_permissions: ['read'],
                        withdrawn: false,
                        date_registered: '2024-06-01T14:47:40.064000',
                    }),
                    relationships: {
                        contributors: {
                            links: { related: { href: 'https://api.osf.io/v2/registrations/reg-456/contributors/' } },
                        },
                        files: {
                            links: { related: { href: 'https://api.osf.io/v2/registrations/reg-456/files/' } },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/registrations/reg-456/',
                        html: 'https://osf.io/reg-456/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.getById('reg-456');

            expect(result.title).toBe('Flattened Registration');
            expect(result.current_user_permissions).toEqual(['read']);
            expect(result.date_registered).toBe('2024-06-01T14:47:40.064000');
            expect(result.relationships?.contributors).toBeDefined();
            expect(result.relationships?.files).toBeDefined();
        });

        it('should handle withdrawn registration with limited fields', async () => {
            const mockResponse: JsonApiResponse<OsfRegistrationAttributes> = {
                data: {
                    id: 'withdrawn-reg',
                    type: 'registrations',
                    attributes: buildRegistrationAttributes({
                        title: 'Withdrawn Study',
                        withdrawn: true,
                        date_withdrawn: '2024-06-15T10:00:00.000000',
                        withdrawal_justification: 'Data quality issues found',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/registrations/withdrawn-reg/',
                        html: 'https://osf.io/withdrawn-reg/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.getById('withdrawn-reg');

            expect(result.withdrawn).toBe(true);
            expect(result.date_withdrawn).toBe('2024-06-15T10:00:00.000000');
            expect(result.withdrawal_justification).toBe('Data quality issues found');
        });

        it('should throw OsfNotFoundError for non-existent registration', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(registrations.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for embargoed registration without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(registrations.getById('embargoed-reg')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listRegistrations(params)', () => {
        it('should fetch paginated list of registrations', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [
                    {
                        id: 'reg-1',
                        type: 'registrations',
                        attributes: buildRegistrationAttributes({ title: 'Registration One' }),
                    },
                    {
                        id: 'reg-2',
                        type: 'registrations',
                        attributes: buildRegistrationAttributes({ title: 'Registration Two', category: 'data' }),
                    },
                ],
                meta: {
                    total: 50,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/registrations/',
                    first: 'https://api.osf.io/v2/registrations/?page=1',
                    last: 'https://api.osf.io/v2/registrations/?page=5',
                    next: 'https://api.osf.io/v2/registrations/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listRegistrations();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Registration One');
            expect(result.data[1].title).toBe('Registration Two');
            expect(result.meta?.total).toBe(50);
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await registrations.listRegistrations({
                'filter[title]': 'open science',
                'filter[public]': true,
            });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btitle%5D=open+science');
            expect(url).toContain('filter%5Bpublic%5D=true');
        });

        it('should apply pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [],
                meta: { total: 50, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/registrations/?page=3',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await registrations.listRegistrations({ page: 3 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=3');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listRegistrations({ 'filter[title]': 'nonexistent' });

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listRegistrationsPaginated(params)', () => {
        it('should return PaginatedResult for registrations', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [
                    {
                        id: 'reg-1',
                        type: 'registrations',
                        attributes: buildRegistrationAttributes({ title: 'Paginated Reg 1' }),
                    },
                ],
                meta: { total: 20, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/registrations/',
                    next: 'https://api.osf.io/v2/registrations/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listRegistrationsPaginated();

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Paginated Reg 1');
            expect(result.hasNext).toBe(true);
        });
    });

    describe('update(id, data)', () => {
        it('should update registration public field', async () => {
            const mockResponse: JsonApiResponse<OsfRegistrationAttributes> = {
                data: {
                    id: 'reg12',
                    type: 'registrations',
                    attributes: buildRegistrationAttributes({
                        title: 'My Registration',
                        public: true,
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/registrations/reg12/',
                        html: 'https://osf.io/reg12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdateRegistrationInput = { public: true };
            const result = await registrations.update('reg12', input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/');
            expect(options?.method).toBe('PATCH');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('registrations');
            expect(body.data.id).toBe('reg12');
            expect(body.data.attributes.public).toBe(true);

            expect(result.public).toBe(true);
        });

        it('should throw OsfNotFoundError for non-existent registration', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(registrations.update('non-existent', { public: true })).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without admin access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(registrations.update('read-only-reg', { public: true })).rejects.toThrow(
                OsfPermissionError,
            );
        });
    });

    describe('listChildren(id)', () => {
        it('should fetch child registrations', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [
                    {
                        id: 'child-reg-1',
                        type: 'registrations',
                        attributes: buildRegistrationAttributes({
                            title: 'Child Registration 1',
                            category: 'data',
                        }),
                    },
                    {
                        id: 'child-reg-2',
                        type: 'registrations',
                        attributes: buildRegistrationAttributes({
                            title: 'Child Registration 2',
                            category: 'analysis',
                        }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listChildren('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/children/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Child Registration 1');
            expect(result.data[1].title).toBe('Child Registration 2');
        });

        it('should handle registration with no children', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listChildren('leaf-reg');

            expect(result.data).toHaveLength(0);
        });

        it('should throw OsfNotFoundError for non-existent registration', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(registrations.listChildren('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listContributors(id)', () => {
        it('should fetch contributors for a registration', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'reg12-user1',
                        type: 'contributors',
                        attributes: {
                            bibliographic: true,
                            permission: 'admin',
                            index: 0,
                        },
                    },
                    {
                        id: 'reg12-user2',
                        type: 'contributors',
                        attributes: {
                            bibliographic: true,
                            permission: 'read',
                            index: 1,
                        },
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listContributors('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/contributors/');

            expect(result.data).toHaveLength(2);
        });
    });

    describe('listFiles(id, provider)', () => {
        it('should fetch files for a registration with default provider', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'file-1',
                        type: 'files',
                        attributes: {
                            name: 'data.csv',
                            kind: 'file',
                            provider: 'osfstorage',
                        },
                    },
                ],
                meta: { total: 1, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listFiles('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/files/osfstorage/');

            expect(result.data).toHaveLength(1);
        });

        it('should fetch files with a custom provider', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await registrations.listFiles('reg12', 'github');

            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/files/github/');
        });
    });

    describe('listWikis(id)', () => {
        it('should fetch wikis for a registration', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'wiki-1',
                        type: 'wikis',
                        attributes: {
                            name: 'home',
                            date_modified: '2024-01-05T00:00:00.000000',
                        },
                    },
                ],
                meta: { total: 1, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listWikis('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/wikis/');

            expect(result.data).toHaveLength(1);
        });
    });

    describe('listLogs(id)', () => {
        it('should fetch logs for a registration', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'log-1',
                        type: 'logs',
                        attributes: {
                            action: 'project_created',
                            date: '2024-01-01T00:00:00.000000',
                        },
                    },
                    {
                        id: 'log-2',
                        type: 'logs',
                        attributes: {
                            action: 'made_public',
                            date: '2024-01-02T00:00:00.000000',
                        },
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await registrations.listLogs('reg12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/registrations/reg12/logs/');

            expect(result.data).toHaveLength(2);
        });
    });
});
