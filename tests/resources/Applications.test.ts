import { Applications } from '../../src/resources/Applications';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import {
    OsfApplicationAttributes,
    CreateApplicationInput,
    UpdateApplicationInput,
} from '../../src/types/application';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal application attributes object */
function buildApplicationAttributes(
    overrides: Partial<OsfApplicationAttributes> = {},
): OsfApplicationAttributes {
    return {
        name: 'My App',
        description: 'An optional description',
        home_url: 'https://example.com',
        callback_url: 'https://example.com/oauth/callback',
        owner: 'user123',
        date_created: '2024-03-14T10:00:00Z',
        ...overrides,
    };
}

describe('Applications', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let applications: Applications;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        applications = new Applications(httpClient);
    });

    describe('getById(clientId)', () => {
        it('should fetch application by client ID', async () => {
            const mockResponse: JsonApiResponse<OsfApplicationAttributes> = {
                data: {
                    id: 'client_abc123',
                    type: 'applications',
                    attributes: buildApplicationAttributes({
                        name: 'Test Application',
                    }),
                    links: {
                        html: 'https://osf.io/settings/applications/client_abc123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await applications.getById('client_abc123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/applications/client_abc123/');

            expect(result.id).toBe('client_abc123');
            expect(result.type).toBe('applications');
            expect(result.name).toBe('Test Application');
            expect(result.home_url).toBe('https://example.com');
            expect(result.callback_url).toBe('https://example.com/oauth/callback');
        });

        it('should throw OsfNotFoundError for non-existent application', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(applications.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(applications.getById('private-app')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listApplications(params)', () => {
        it('should fetch a list of applications', async () => {
            const mockResponse: JsonApiListResponse<OsfApplicationAttributes> = {
                data: [
                    {
                        id: 'app1',
                        type: 'applications',
                        attributes: buildApplicationAttributes({ name: 'App One' }),
                    },
                    {
                        id: 'app2',
                        type: 'applications',
                        attributes: buildApplicationAttributes({ name: 'App Two' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/applications/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await applications.listApplications();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/applications/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('App One');
            expect(result.data[1].name).toBe('App Two');
            expect(result.meta?.total).toBe(2);
        });

        it('should support pagination parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfApplicationAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await applications.listApplications({ page: 2 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=2');
        });

        it('should handle empty application list', async () => {
            const mockResponse: JsonApiListResponse<OsfApplicationAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await applications.listApplications();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listApplicationsPaginated(params)', () => {
        it('should return paginated result for applications', async () => {
            const mockResponse: JsonApiListResponse<OsfApplicationAttributes> = {
                data: [
                    {
                        id: 'app1',
                        type: 'applications',
                        attributes: buildApplicationAttributes({ name: 'Paginated App' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/applications/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await applications.listApplicationsPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/applications/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Paginated App');
        });

        it('should support pagination parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfApplicationAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await applications.listApplicationsPaginated({ page: 3 });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('page=3');
        });
    });

    describe('create(data)', () => {
        it('should create a new application', async () => {
            const mockResponse: JsonApiResponse<OsfApplicationAttributes> = {
                data: {
                    id: 'new-client-id',
                    type: 'applications',
                    attributes: buildApplicationAttributes({
                        name: 'New Application',
                        description: 'A brand new app',
                        home_url: 'https://newapp.example.com',
                        callback_url: 'https://newapp.example.com/callback',
                    }),
                    links: {
                        html: 'https://osf.io/settings/applications/new-client-id/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: CreateApplicationInput = {
                name: 'New Application',
                description: 'A brand new app',
                home_url: 'https://newapp.example.com',
                callback_url: 'https://newapp.example.com/callback',
            };
            const result = await applications.create(input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/applications/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('applications');
            expect(body.data.attributes.name).toBe('New Application');
            expect(body.data.attributes.home_url).toBe('https://newapp.example.com');
            expect(body.data.attributes.callback_url).toBe('https://newapp.example.com/callback');

            expect(result.id).toBe('new-client-id');
            expect(result.name).toBe('New Application');
        });

        it('should throw OsfPermissionError without permission', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(
                applications.create({
                    name: 'Unauthorized',
                    home_url: 'https://example.com',
                    callback_url: 'https://example.com/cb',
                }),
            ).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('update(clientId, data)', () => {
        it('should update application fields', async () => {
            const mockResponse: JsonApiResponse<OsfApplicationAttributes> = {
                data: {
                    id: 'client_abc123',
                    type: 'applications',
                    attributes: buildApplicationAttributes({
                        name: 'Updated App',
                        description: 'Updated description',
                    }),
                    links: {
                        html: 'https://osf.io/settings/applications/client_abc123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const input: UpdateApplicationInput = {
                name: 'Updated App',
                description: 'Updated description',
            };
            const result = await applications.update('client_abc123', input);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/applications/client_abc123/');
            expect(options?.method).toBe('PATCH');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('applications');
            expect(body.data.id).toBe('client_abc123');
            expect(body.data.attributes.name).toBe('Updated App');
            expect(body.data.attributes.description).toBe('Updated description');

            expect(result.name).toBe('Updated App');
        });

        it('should throw OsfNotFoundError for non-existent application', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(applications.update('non-existent', { name: 'Test' })).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(applications.update('read-only', { name: 'Test' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('delete(clientId)', () => {
        it('should deactivate an application', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await applications.delete('client_abc123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/applications/client_abc123/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfNotFoundError for non-existent application', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(applications.delete('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without permission', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(applications.delete('no-access')).rejects.toThrow(OsfPermissionError);
        });
    });
});
