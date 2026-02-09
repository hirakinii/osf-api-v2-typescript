import { Citations } from '../../src/resources/Citations';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfCitationStyleAttributes } from '../../src/types/citation-style';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal citation style attributes object */
function buildCitationStyleAttributes(
    overrides: Partial<OsfCitationStyleAttributes> = {},
): OsfCitationStyleAttributes {
    return {
        title: 'American Psychological Association 6th edition',
        short_title: 'APA',
        summary: null,
        date_parsed: '2015-02-16T04:16:26.233000',
        ...overrides,
    };
}

describe('Citations', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let citations: Citations;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        citations = new Citations(httpClient);
    });

    describe('listStyles(params)', () => {
        it('should fetch a list of citation styles', async () => {
            const mockResponse: JsonApiListResponse<OsfCitationStyleAttributes> = {
                data: [
                    {
                        id: 'apa',
                        type: 'citation-styles',
                        attributes: buildCitationStyleAttributes(),
                    },
                    {
                        id: 'modern-language-association',
                        type: 'citation-styles',
                        attributes: buildCitationStyleAttributes({
                            title: 'Modern Language Association 8th edition',
                            short_title: 'MLA',
                        }),
                    },
                ],
                meta: { total: 1149, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/citations/styles/',
                    next: 'https://api.osf.io/v2/citations/styles/?page=2',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await citations.listStyles();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/citations/styles/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('American Psychological Association 6th edition');
            expect(result.data[0].short_title).toBe('APA');
            expect(result.data[1].title).toBe('Modern Language Association 8th edition');
            expect(result.meta?.total).toBe(1149);
        });

        it('should support filter[title] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfCitationStyleAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await citations.listStyles({ 'filter[title]': 'open' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btitle%5D=open');
        });

        it('should support filter[id] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfCitationStyleAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await citations.listStyles({ 'filter[id]': 'apa' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bid%5D=apa');
        });

        it('should handle empty citation styles list', async () => {
            const mockResponse: JsonApiListResponse<OsfCitationStyleAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await citations.listStyles();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listStylesPaginated(params)', () => {
        it('should return paginated result for citation styles', async () => {
            const mockResponse: JsonApiListResponse<OsfCitationStyleAttributes> = {
                data: [
                    {
                        id: 'chicago-author-date',
                        type: 'citation-styles',
                        attributes: buildCitationStyleAttributes({
                            title: 'Chicago Manual of Style 17th edition (author-date)',
                            short_title: 'Chicago',
                        }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/citations/styles/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await citations.listStylesPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/citations/styles/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Chicago Manual of Style 17th edition (author-date)');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfCitationStyleAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await citations.listStylesPaginated({ 'filter[title]': 'IEEE' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btitle%5D=IEEE');
        });
    });

    describe('getStyle(styleId)', () => {
        it('should fetch a citation style by ID', async () => {
            const mockResponse: JsonApiResponse<OsfCitationStyleAttributes> = {
                data: {
                    id: 'apa',
                    type: 'citation-styles',
                    attributes: buildCitationStyleAttributes({
                        title: 'American Psychological Association 6th edition',
                        short_title: 'APA',
                        summary: null,
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/citations/styles/apa/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await citations.getStyle('apa');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/citations/styles/apa/');

            expect(result.id).toBe('apa');
            expect(result.type).toBe('citation-styles');
            expect(result.title).toBe('American Psychological Association 6th edition');
            expect(result.short_title).toBe('APA');
        });

        it('should throw OsfNotFoundError for non-existent citation style', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(citations.getStyle('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
