import { ViewOnlyLinks } from '../../src/resources/ViewOnlyLinks';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfViewOnlyLinkAttributes } from '../../src/types/view-only-link';
import { OsfNodeAttributes } from '../../src/types/node';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal view only link attributes object */
function buildViewOnlyLinkAttributes(
    overrides: Partial<OsfViewOnlyLinkAttributes> = {},
): OsfViewOnlyLinkAttributes {
    return {
        name: 'Shared project link',
        key: 'abcdef1234567890',
        date_created: '2024-01-15T10:30:00.000000',
        anonymous: false,
        ...overrides,
    };
}

/** Helper to build a minimal node attributes object */
function buildNodeAttributes(
    overrides: Partial<OsfNodeAttributes> = {},
): OsfNodeAttributes {
    return {
        title: 'Test Node',
        category: 'project',
        description: '',
        current_user_can_comment: true,
        date_created: '2024-01-01T00:00:00.000000',
        date_modified: '2024-01-01T00:00:00.000000',
        fork: false,
        preprint: false,
        public: true,
        registration: false,
        collection: false,
        tags: [],
        ...overrides,
    };
}

describe('ViewOnlyLinks', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let viewOnlyLinks: ViewOnlyLinks;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        viewOnlyLinks = new ViewOnlyLinks(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch a view only link by ID', async () => {
            const mockResponse: JsonApiResponse<OsfViewOnlyLinkAttributes> = {
                data: {
                    id: 'vol123',
                    type: 'view-only-links',
                    attributes: buildViewOnlyLinkAttributes({
                        name: 'Review Link',
                        anonymous: true,
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/view_only_links/vol123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await viewOnlyLinks.getById('vol123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/view_only_links/vol123/');

            expect(result.id).toBe('vol123');
            expect(result.type).toBe('view-only-links');
            expect(result.name).toBe('Review Link');
            expect(result.anonymous).toBe(true);
            expect(result.key).toBe('abcdef1234567890');
            expect(result.date_created).toBe('2024-01-15T10:30:00.000000');
        });

        it('should throw OsfNotFoundError for non-existent view only link', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(viewOnlyLinks.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(viewOnlyLinks.getById('private-vol')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listNodes(linkId)', () => {
        it('should fetch nodes accessible via a view only link', async () => {
            const mockResponse: JsonApiListResponse<OsfNodeAttributes> = {
                data: [
                    {
                        id: 'node1',
                        type: 'nodes',
                        attributes: buildNodeAttributes({ title: 'Project A' }),
                    },
                    {
                        id: 'node2',
                        type: 'nodes',
                        attributes: buildNodeAttributes({ title: 'Component B' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/view_only_links/vol123/nodes/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await viewOnlyLinks.listNodes('vol123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/view_only_links/vol123/nodes/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Project A');
            expect(result.data[1].title).toBe('Component B');
            expect(result.meta?.total).toBe(2);
        });

        it('should handle empty nodes list', async () => {
            const mockResponse: JsonApiListResponse<OsfNodeAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await viewOnlyLinks.listNodes('vol123');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });

        it('should throw OsfPermissionError for non-admin access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(viewOnlyLinks.listNodes('vol123')).rejects.toThrow(OsfPermissionError);
        });
    });
});
