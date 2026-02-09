import { RegistrationProviders } from '../../src/resources/RegistrationProviders';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfRegistrationProviderAttributes } from '../../src/types/registration-provider';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal registration provider attributes object */
function buildProviderAttributes(
    overrides: Partial<OsfRegistrationProviderAttributes> = {},
): OsfRegistrationProviderAttributes {
    return {
        name: 'Open Science Framework',
        description: 'A scholarly commons to connect the entire research cycle',
        domain: 'osf.io',
        advisory_board: '',
        email_support: '',
        email_contact: '',
        banner_path: '/static/img/registration_providers/cos-logo.png',
        logo_path: '/static/img/registration_providers/cos-logo.png',
        header_text: '',
        social_twitter: '',
        social_facebook: '',
        social_instagram: '',
        example: 'khbvy',
        subjects_acceptable: [],
        ...overrides,
    };
}

describe('RegistrationProviders', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let providers: RegistrationProviders;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        providers = new RegistrationProviders(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch registration provider by ID', async () => {
            const mockResponse: JsonApiResponse<OsfRegistrationProviderAttributes> = {
                data: {
                    id: 'osf',
                    type: 'registration_providers',
                    attributes: buildProviderAttributes(),
                    links: {
                        self: 'https://api.osf.io/v2/providers/registrations/osf/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.getById('osf');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/providers/registrations/osf/');

            expect(result.id).toBe('osf');
            expect(result.type).toBe('registration_providers');
            expect(result.name).toBe('Open Science Framework');
            expect(result.domain).toBe('osf.io');
        });

        it('should throw OsfNotFoundError for non-existent provider', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(providers.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(providers.getById('private-provider')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listProviders(params)', () => {
        it('should fetch a list of registration providers', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationProviderAttributes> = {
                data: [
                    {
                        id: 'osf',
                        type: 'registration_providers',
                        attributes: buildProviderAttributes(),
                    },
                    {
                        id: 'other',
                        type: 'registration_providers',
                        attributes: buildProviderAttributes({
                            name: 'Other Registry',
                            description: 'Another registration provider',
                        }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/providers/registrations/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.listProviders();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/providers/registrations/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Open Science Framework');
            expect(result.data[1].name).toBe('Other Registry');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter[name] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await providers.listProviders({ 'filter[name]': 'OSF' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=OSF');
        });

        it('should support filter[id] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await providers.listProviders({ 'filter[id]': 'osf' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bid%5D=osf');
        });

        it('should handle empty provider list', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.listProviders();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listProvidersPaginated(params)', () => {
        it('should return paginated result for registration providers', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationProviderAttributes> = {
                data: [
                    {
                        id: 'osf',
                        type: 'registration_providers',
                        attributes: buildProviderAttributes(),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/providers/registrations/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await providers.listProvidersPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/providers/registrations/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Open Science Framework');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfRegistrationProviderAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await providers.listProvidersPaginated({ 'filter[name]': 'OSF' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=OSF');
        });
    });
});
