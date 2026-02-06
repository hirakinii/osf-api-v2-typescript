import { Institutions } from '../../src/resources/Institutions';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfInstitutionAttributes } from '../../src/types/institution';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal institution attributes object */
function buildInstitutionAttributes(
    overrides: Partial<OsfInstitutionAttributes> = {},
): OsfInstitutionAttributes {
    return {
        name: 'Test Institution',
        description: 'A test institution',
        ...overrides,
    };
}

describe('Institutions', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let institutions: Institutions;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        institutions = new Institutions(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch institution by ID', async () => {
            const mockResponse: JsonApiResponse<OsfInstitutionAttributes> = {
                data: {
                    id: 'cos',
                    type: 'institutions',
                    attributes: buildInstitutionAttributes({
                        name: 'Center For Open Science',
                        description: 'COS is a non-profit technology company.',
                        iri: 'http://www.cos.io',
                        ror_iri: 'https://ror.org/000000000',
                        iris: ['https://ror.org/000000000', 'http://www.cos.io/'],
                        assets: {
                            logo: 'https://storage.test.com/cos-shield.png',
                            logo_rounded: 'https://storage.test.com/cos-shield-rounded.png',
                            banner: 'https://storage.test.com/cos-banner.png',
                        },
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/institutions/cos/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.getById('cos');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/institutions/cos/');

            expect(result.id).toBe('cos');
            expect(result.type).toBe('institutions');
            expect(result.name).toBe('Center For Open Science');
            expect(result.description).toBe('COS is a non-profit technology company.');
            expect(result.iri).toBe('http://www.cos.io');
            expect(result.ror_iri).toBe('https://ror.org/000000000');
            expect(result.iris).toEqual(['https://ror.org/000000000', 'http://www.cos.io/']);
            expect(result.assets).toEqual({
                logo: 'https://storage.test.com/cos-shield.png',
                logo_rounded: 'https://storage.test.com/cos-shield-rounded.png',
                banner: 'https://storage.test.com/cos-banner.png',
            });
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfInstitutionAttributes> = {
                data: {
                    id: 'uva',
                    type: 'institutions',
                    attributes: buildInstitutionAttributes({
                        name: 'University of Virginia',
                    }),
                    relationships: {
                        nodes: {
                            links: { related: { href: 'https://api.osf.io/v2/institutions/uva/nodes/' } },
                        },
                        users: {
                            links: { related: { href: 'https://api.osf.io/v2/institutions/uva/users/' } },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/institutions/uva/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.getById('uva');

            expect(result.name).toBe('University of Virginia');
            expect(result.relationships?.nodes).toBeDefined();
            expect(result.relationships?.users).toBeDefined();
        });

        it('should throw OsfNotFoundError for non-existent institution', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(institutions.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError when access is denied', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(institutions.getById('private-inst')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listInstitutions(params)', () => {
        it('should fetch paginated list of institutions', async () => {
            const mockResponse: JsonApiListResponse<OsfInstitutionAttributes> = {
                data: [
                    {
                        id: 'cos',
                        type: 'institutions',
                        attributes: buildInstitutionAttributes({ name: 'Center For Open Science' }),
                    },
                    {
                        id: 'uva',
                        type: 'institutions',
                        attributes: buildInstitutionAttributes({ name: 'University of Virginia' }),
                    },
                ],
                meta: {
                    total: 50,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/institutions/',
                    first: 'https://api.osf.io/v2/institutions/?page=1',
                    last: 'https://api.osf.io/v2/institutions/?page=5',
                    next: 'https://api.osf.io/v2/institutions/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listInstitutions();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/institutions/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Center For Open Science');
            expect(result.data[1].name).toBe('University of Virginia');
            expect(result.meta?.total).toBe(50);
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfInstitutionAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await institutions.listInstitutions({
                'filter[name]': 'Open Science',
            });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=Open+Science');
        });

        it('should apply pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfInstitutionAttributes> = {
                data: [],
                meta: { total: 50, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/institutions/?page=3',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await institutions.listInstitutions({ page: 3 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=3');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfInstitutionAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listInstitutions({ 'filter[name]': 'nonexistent' });

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listInstitutionsPaginated(params)', () => {
        it('should return PaginatedResult for institutions', async () => {
            const mockResponse: JsonApiListResponse<OsfInstitutionAttributes> = {
                data: [
                    {
                        id: 'cos',
                        type: 'institutions',
                        attributes: buildInstitutionAttributes({ name: 'Paginated Institution 1' }),
                    },
                ],
                meta: { total: 20, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/institutions/',
                    next: 'https://api.osf.io/v2/institutions/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listInstitutionsPaginated();

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Paginated Institution 1');
            expect(result.hasNext).toBe(true);
        });
    });

    describe('listUsers(institutionId)', () => {
        it('should fetch users affiliated with an institution', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'user1',
                        type: 'users',
                        attributes: {
                            full_name: 'John Doe',
                            given_name: 'John',
                            family_name: 'Doe',
                        },
                    },
                    {
                        id: 'user2',
                        type: 'users',
                        attributes: {
                            full_name: 'Jane Smith',
                            given_name: 'Jane',
                            family_name: 'Smith',
                        },
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listUsers('cos');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/institutions/cos/users/');

            expect(result.data).toHaveLength(2);
        });

        it('should handle institution with no users', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listUsers('empty-inst');

            expect(result.data).toHaveLength(0);
        });

        it('should throw OsfNotFoundError for non-existent institution', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(institutions.listUsers('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listNodes(institutionId)', () => {
        it('should fetch nodes affiliated with an institution', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'node1',
                        type: 'nodes',
                        attributes: {
                            title: 'Open Science Project',
                            category: 'project',
                            public: true,
                        },
                    },
                    {
                        id: 'node2',
                        type: 'nodes',
                        attributes: {
                            title: 'Data Analysis',
                            category: 'data',
                            public: true,
                        },
                    },
                ],
                meta: { total: 2, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listNodes('cos');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/institutions/cos/nodes/');

            expect(result.data).toHaveLength(2);
        });

        it('should handle institution with no nodes', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listNodes('empty-inst');

            expect(result.data).toHaveLength(0);
        });

        it('should throw OsfNotFoundError for non-existent institution', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(institutions.listNodes('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listRegistrations(institutionId)', () => {
        it('should fetch registrations affiliated with an institution', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'reg1',
                        type: 'registrations',
                        attributes: {
                            title: 'Registered Study',
                            category: 'project',
                            public: true,
                            registration: true,
                        },
                    },
                ],
                meta: { total: 1, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listRegistrations('cos');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/institutions/cos/registrations/');

            expect(result.data).toHaveLength(1);
        });

        it('should handle institution with no registrations', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await institutions.listRegistrations('empty-inst');

            expect(result.data).toHaveLength(0);
        });

        it('should throw OsfNotFoundError for non-existent institution', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(institutions.listRegistrations('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
