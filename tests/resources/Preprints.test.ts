import { Preprints } from '../../src/resources/Preprints';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfPreprintAttributes, CreatePreprintInput, UpdatePreprintInput } from '../../src/types/preprint';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal preprint attributes object */
function buildPreprintAttributes(
    overrides: Partial<OsfPreprintAttributes> = {},
): OsfPreprintAttributes {
    return {
        title: 'Test Preprint',
        description: 'A test preprint',
        date_created: '2024-01-01T00:00:00.000000',
        date_modified: '2024-01-02T00:00:00.000000',
        date_published: '2024-01-03T00:00:00.000000',
        doi: '10.1234/test',
        is_published: true,
        is_preprint_orphan: false,
        tags: [],
        public: true,
        reviews_state: 'accepted',
        ...overrides,
    };
}

describe('Preprints', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let preprints: Preprints;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        preprints = new Preprints(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch preprint by ID', async () => {
            const mockResponse: JsonApiResponse<OsfPreprintAttributes> = {
                data: {
                    id: 'pp12',
                    type: 'preprints',
                    attributes: buildPreprintAttributes({
                        title: 'My Preprint',
                        description: 'A study on testing',
                        tags: ['open-science', 'preprint'],
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/preprints/pp12/',
                        html: 'https://osf.io/preprints/pp12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.getById('pp12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/pp12/');

            expect(result.id).toBe('pp12');
            expect(result.type).toBe('preprints');
            expect(result.title).toBe('My Preprint');
            expect(result.is_published).toBe(true);
            expect(result.tags).toEqual(['open-science', 'preprint']);
        });

        it('should transform response with flattened attributes', async () => {
            const mockResponse: JsonApiResponse<OsfPreprintAttributes> = {
                data: {
                    id: 'pp-456',
                    type: 'preprints',
                    attributes: buildPreprintAttributes({
                        title: 'Flattened Preprint',
                        current_user_permissions: ['read'],
                        reviews_state: 'pending',
                        date_published: '2024-06-01T14:47:40.064000',
                    }),
                    relationships: {
                        contributors: {
                            links: { related: { href: 'https://api.osf.io/v2/preprints/pp-456/contributors/' } },
                        },
                        files: {
                            links: { related: { href: 'https://api.osf.io/v2/preprints/pp-456/files/' } },
                        },
                    },
                    links: {
                        self: 'https://api.osf.io/v2/preprints/pp-456/',
                        html: 'https://osf.io/preprints/pp-456/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.getById('pp-456');

            expect(result.title).toBe('Flattened Preprint');
            expect(result.current_user_permissions).toEqual(['read']);
            expect(result.reviews_state).toBe('pending');
            expect(result.date_published).toBe('2024-06-01T14:47:40.064000');
            expect(result.relationships?.contributors).toBeDefined();
            expect(result.relationships?.files).toBeDefined();
        });

        it('should handle withdrawn preprint', async () => {
            const mockResponse: JsonApiResponse<OsfPreprintAttributes> = {
                data: {
                    id: 'withdrawn-pp',
                    type: 'preprints',
                    attributes: buildPreprintAttributes({
                        title: 'Withdrawn Preprint',
                        reviews_state: 'withdrawn',
                        date_withdrawn: '2024-06-15T10:00:00.000000',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/preprints/withdrawn-pp/',
                        html: 'https://osf.io/preprints/withdrawn-pp/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.getById('withdrawn-pp');

            expect(result.reviews_state).toBe('withdrawn');
            expect(result.date_withdrawn).toBe('2024-06-15T10:00:00.000000');
        });

        it('should throw OsfNotFoundError for non-existent preprint', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(preprints.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for private preprint without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(preprints.getById('private-pp')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listPreprints(params)', () => {
        it('should fetch paginated list of preprints', async () => {
            const mockResponse: JsonApiListResponse<OsfPreprintAttributes> = {
                data: [
                    {
                        id: 'pp-1',
                        type: 'preprints',
                        attributes: buildPreprintAttributes({ title: 'Preprint One' }),
                    },
                    {
                        id: 'pp-2',
                        type: 'preprints',
                        attributes: buildPreprintAttributes({ title: 'Preprint Two', doi: '10.5678/test2' }),
                    },
                ],
                meta: {
                    total: 50,
                    per_page: 10,
                },
                links: {
                    self: 'https://api.osf.io/v2/preprints/',
                    first: 'https://api.osf.io/v2/preprints/?page=1',
                    last: 'https://api.osf.io/v2/preprints/?page=5',
                    next: 'https://api.osf.io/v2/preprints/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.listPreprints();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Preprint One');
            expect(result.data[1].title).toBe('Preprint Two');
            expect(result.meta?.total).toBe(50);
        });

        it('should apply filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfPreprintAttributes> = {
                data: [],
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await preprints.listPreprints({
                'filter[is_published]': true,
                'filter[provider]': 'osf',
            });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bis_published%5D=true');
            expect(url).toContain('filter%5Bprovider%5D=osf');
        });

        it('should apply pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfPreprintAttributes> = {
                data: [],
                meta: { total: 50, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/preprints/?page=3',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await preprints.listPreprints({ page: 3 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=3');
        });

        it('should handle empty results', async () => {
            const mockResponse: JsonApiListResponse<OsfPreprintAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.listPreprints({ 'filter[provider]': 'nonexistent' });

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listPreprintsPaginated(params)', () => {
        it('should return PaginatedResult for preprints', async () => {
            const mockResponse: JsonApiListResponse<OsfPreprintAttributes> = {
                data: [
                    {
                        id: 'pp-1',
                        type: 'preprints',
                        attributes: buildPreprintAttributes({ title: 'Paginated Preprint 1' }),
                    },
                ],
                meta: { total: 20, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/preprints/',
                    next: 'https://api.osf.io/v2/preprints/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.listPreprintsPaginated();

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Paginated Preprint 1');
            expect(result.hasNext).toBe(true);
        });
    });

    describe('create(data)', () => {
        it('should create a new preprint', async () => {
            const mockResponse: JsonApiResponse<OsfPreprintAttributes> = {
                data: {
                    id: 'new-pp',
                    type: 'preprints',
                    attributes: buildPreprintAttributes({
                        title: 'New Preprint',
                        description: 'A newly created preprint',
                        is_published: false,
                        reviews_state: 'initial',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/preprints/new-pp/',
                        html: 'https://osf.io/preprints/new-pp/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreatePreprintInput = {
                title: 'New Preprint',
                description: 'A newly created preprint',
            };
            const result = await preprints.create(input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('preprints');
            expect(body.data.attributes.title).toBe('New Preprint');
            expect(body.data.attributes.description).toBe('A newly created preprint');

            expect(result.id).toBe('new-pp');
            expect(result.title).toBe('New Preprint');
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(preprints.create({ title: 'Unauthorized' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('update(id, data)', () => {
        it('should update preprint fields', async () => {
            const mockResponse: JsonApiResponse<OsfPreprintAttributes> = {
                data: {
                    id: 'pp12',
                    type: 'preprints',
                    attributes: buildPreprintAttributes({
                        title: 'Updated Preprint',
                        is_published: true,
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/preprints/pp12/',
                        html: 'https://osf.io/preprints/pp12/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdatePreprintInput = { title: 'Updated Preprint', is_published: true };
            const result = await preprints.update('pp12', input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/pp12/');
            expect(options?.method).toBe('PATCH');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('preprints');
            expect(body.data.id).toBe('pp12');
            expect(body.data.attributes.title).toBe('Updated Preprint');
            expect(body.data.attributes.is_published).toBe(true);

            expect(result.title).toBe('Updated Preprint');
            expect(result.is_published).toBe(true);
        });

        it('should throw OsfNotFoundError for non-existent preprint', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(preprints.update('non-existent', { title: 'Test' })).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without admin access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(preprints.update('read-only-pp', { title: 'Test' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listContributors(id)', () => {
        it('should fetch contributors for a preprint', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'pp12-user1',
                        type: 'contributors',
                        attributes: {
                            bibliographic: true,
                            permission: 'admin',
                            index: 0,
                        },
                    },
                    {
                        id: 'pp12-user2',
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

            const result = await preprints.listContributors('pp12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/pp12/contributors/');

            expect(result.data).toHaveLength(2);
        });

        it('should throw OsfNotFoundError for non-existent preprint', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(preprints.listContributors('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listFiles(id)', () => {
        it('should fetch files for a preprint', async () => {
            const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
                data: [
                    {
                        id: 'file-1',
                        type: 'files',
                        attributes: {
                            name: 'manuscript.pdf',
                            kind: 'file',
                            provider: 'osfstorage',
                        },
                    },
                ],
                meta: { total: 1, per_page: 10 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.listFiles('pp12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/pp12/files/');

            expect(result.data).toHaveLength(1);
        });
    });

    describe('getCitation(id, styleId)', () => {
        it('should fetch citation details for a preprint', async () => {
            const mockResponse: JsonApiResponse<Record<string, unknown>> = {
                data: {
                    id: 'pp12',
                    type: 'preprint-citation',
                    attributes: {
                        author: 'Doe, J.',
                        title: 'My Preprint',
                        doi: '10.1234/test',
                        publisher: 'OSF Preprints',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.getCitation('pp12');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/pp12/citation/');

            expect(result.id).toBe('pp12');
        });

        it('should fetch styled citation with style ID', async () => {
            const mockResponse: JsonApiResponse<Record<string, unknown>> = {
                data: {
                    id: 'pp12',
                    type: 'styled-citations',
                    attributes: {
                        citation: 'Doe, J. (2024). My Preprint. OSF Preprints. https://doi.org/10.1234/test',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await preprints.getCitation('pp12', 'apa');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/preprints/pp12/citation/apa/');

            expect(result.id).toBe('pp12');
        });

        it('should throw OsfNotFoundError for non-existent preprint citation', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(preprints.getCitation('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
