import { Subjects } from '../../src/resources/Subjects';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfSubjectAttributes } from '../../src/types/subject';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal subject attributes object */
function buildSubjectAttributes(
    overrides: Partial<OsfSubjectAttributes> = {},
): OsfSubjectAttributes {
    return {
        text: 'Social and Behavioral Sciences',
        taxonomy_name: 'OSF',
        ...overrides,
    };
}

describe('Subjects', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let subjects: Subjects;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        subjects = new Subjects(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch subject by ID', async () => {
            const mockResponse: JsonApiResponse<OsfSubjectAttributes> = {
                data: {
                    id: 'subj123',
                    type: 'subjects',
                    attributes: buildSubjectAttributes({
                        text: 'Climate Change',
                        taxonomy_name: 'OSF',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/subjects/subj123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await subjects.getById('subj123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/subjects/subj123/');

            expect(result.id).toBe('subj123');
            expect(result.type).toBe('subjects');
            expect(result.text).toBe('Climate Change');
            expect(result.taxonomy_name).toBe('OSF');
        });

        it('should throw OsfNotFoundError for non-existent subject', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(subjects.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for forbidden access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(subjects.getById('private-subj')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listSubjects(params)', () => {
        it('should fetch a list of subjects', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [
                    {
                        id: 'subj1',
                        type: 'subjects',
                        attributes: buildSubjectAttributes({ text: 'Social and Behavioral Sciences' }),
                    },
                    {
                        id: 'subj2',
                        type: 'subjects',
                        attributes: buildSubjectAttributes({ text: 'Engineering' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/subjects/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await subjects.listSubjects();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/subjects/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].text).toBe('Social and Behavioral Sciences');
            expect(result.data[1].text).toBe('Engineering');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter[text] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await subjects.listSubjects({ 'filter[text]': 'Climate' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btext%5D=Climate');
        });

        it('should support filter[parent] parameter', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await subjects.listSubjects({ 'filter[parent]': 'parent123' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bparent%5D=parent123');
        });

        it('should handle empty subject list', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await subjects.listSubjects();

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });
    });

    describe('listSubjectsPaginated(params)', () => {
        it('should return paginated result for subjects', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [
                    {
                        id: 'subj1',
                        type: 'subjects',
                        attributes: buildSubjectAttributes({ text: 'Psychology' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/subjects/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await subjects.listSubjectsPaginated();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/subjects/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].text).toBe('Psychology');
        });

        it('should support filter parameters for paginated results', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await subjects.listSubjectsPaginated({ 'filter[text]': 'Biology' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Btext%5D=Biology');
        });
    });

    describe('listChildren(id)', () => {
        it('should fetch child subjects for a given subject', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [
                    {
                        id: 'child1',
                        type: 'subjects',
                        attributes: buildSubjectAttributes({ text: 'Cognitive Psychology' }),
                    },
                    {
                        id: 'child2',
                        type: 'subjects',
                        attributes: buildSubjectAttributes({ text: 'Social Psychology' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/subjects/parent123/children/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await subjects.listChildren('parent123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/subjects/parent123/children/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].text).toBe('Cognitive Psychology');
            expect(result.data[1].text).toBe('Social Psychology');
        });

        it('should handle subject with no children', async () => {
            const mockResponse: JsonApiListResponse<OsfSubjectAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await subjects.listChildren('leaf-subj');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });

        it('should throw OsfNotFoundError for non-existent parent subject', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(subjects.listChildren('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });
});
