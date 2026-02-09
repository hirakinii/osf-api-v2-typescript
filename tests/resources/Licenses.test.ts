import { Licenses } from '../../src/resources/Licenses';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfLicenseAttributes } from '../../src/types/license';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal license attributes object */
function buildLicenseAttributes(
    overrides: Partial<OsfLicenseAttributes> = {},
): OsfLicenseAttributes {
    return {
        name: 'MIT License',
        text: 'Copyright (c) {{year}}, {{copyrightHolders}}\n\nPermission is hereby granted...',
        required_fields: ['year', 'copyrightHolders'],
        ...overrides,
    };
}

describe('Licenses', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let licenses: Licenses;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        licenses = new Licenses(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch license by ID', async () => {
            const mockResponse: JsonApiResponse<OsfLicenseAttributes> = {
                data: {
                    id: '563c1cf88c5e4a3877f9e968',
                    type: 'licenses',
                    attributes: buildLicenseAttributes({
                        name: 'BSD 2-Clause "Simplified" License',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/licenses/563c1cf88c5e4a3877f9e968/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await licenses.getById('563c1cf88c5e4a3877f9e968');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/license/563c1cf88c5e4a3877f9e968/');

            expect(result.id).toBe('563c1cf88c5e4a3877f9e968');
            expect(result.type).toBe('licenses');
            expect(result.name).toBe('BSD 2-Clause "Simplified" License');
            expect(result.required_fields).toEqual(['year', 'copyrightHolders']);
        });

        it('should throw OsfNotFoundError for non-existent license', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(licenses.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(licenses.getById('private-lic')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listLicenses(params)', () => {
        it('should fetch a list of licenses', async () => {
            const mockResponse: JsonApiListResponse<OsfLicenseAttributes> = {
                data: [
                    {
                        id: 'lic1',
                        type: 'licenses',
                        attributes: buildLicenseAttributes({ name: 'MIT License' }),
                    },
                    {
                        id: 'lic2',
                        type: 'licenses',
                        attributes: buildLicenseAttributes({
                            name: 'Apache License 2.0',
                            required_fields: [],
                        }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/licenses/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await licenses.listLicenses();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/licenses/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('MIT License');
            expect(result.data[1].name).toBe('Apache License 2.0');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter[name] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfLicenseAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await licenses.listLicenses({ 'filter[name]': 'apache' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=apache');
        });

        it('should support filter[id] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfLicenseAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await licenses.listLicenses({ 'filter[id]': 'lic123' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bid%5D=lic123');
        });

        it('should handle empty license list', async () => {
            const mockResponse: JsonApiListResponse<OsfLicenseAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await licenses.listLicenses();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listLicensesPaginated(params)', () => {
        it('should return paginated result for licenses', async () => {
            const mockResponse: JsonApiListResponse<OsfLicenseAttributes> = {
                data: [
                    {
                        id: 'lic1',
                        type: 'licenses',
                        attributes: buildLicenseAttributes({ name: 'GPL-3.0' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/licenses/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await licenses.listLicensesPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/licenses/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('GPL-3.0');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfLicenseAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await licenses.listLicensesPaginated({ 'filter[name]': 'MIT' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bname%5D=MIT');
        });
    });
});
