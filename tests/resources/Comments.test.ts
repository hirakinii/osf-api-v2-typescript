import { Comments } from '../../src/resources/Comments';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import { OsfCommentAttributes } from '../../src/types/comment';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal comment attributes object */
function buildCommentAttributes(
    overrides: Partial<OsfCommentAttributes> = {},
): OsfCommentAttributes {
    return {
        can_edit: true,
        content: 'Test comment content',
        date_created: '2024-01-15T10:30:00.000000',
        date_modified: '2024-01-15T10:30:00.000000',
        modified: false,
        deleted: false,
        is_abuse: false,
        is_ham: false,
        has_report: false,
        has_children: false,
        page: 'node',
        ...overrides,
    };
}

describe('Comments', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let httpClient: HttpClient;
    let comments: Comments;

    beforeEach(() => {
        fetchMock.resetMocks();
        httpClient = new HttpClient({ token, baseUrl });
        comments = new Comments(httpClient);
    });

    describe('getById(id)', () => {
        it('should fetch comment by ID', async () => {
            const mockResponse: JsonApiResponse<OsfCommentAttributes> = {
                data: {
                    id: 'comment123',
                    type: 'comments',
                    attributes: buildCommentAttributes({
                        content: 'A specific comment',
                        page: 'node',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/comments/comment123/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.getById('comment123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/comments/comment123/');

            expect(result.id).toBe('comment123');
            expect(result.type).toBe('comments');
            expect(result.content).toBe('A specific comment');
            expect(result.page).toBe('node');
            expect(result.can_edit).toBe(true);
        });

        it('should throw OsfNotFoundError for non-existent comment', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(comments.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError for private comment without access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(comments.getById('private-comment')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('listByNode(nodeId)', () => {
        it('should fetch comments for a node', async () => {
            const mockResponse: JsonApiListResponse<OsfCommentAttributes> = {
                data: [
                    {
                        id: 'comment1',
                        type: 'comments',
                        attributes: buildCommentAttributes({ content: 'First comment' }),
                    },
                    {
                        id: 'comment2',
                        type: 'comments',
                        attributes: buildCommentAttributes({ content: 'Second comment' }),
                    },
                ],
                meta: { total: 2, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/node123/comments/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.listByNode('node123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/node123/comments/');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].content).toBe('First comment');
            expect(result.data[1].content).toBe('Second comment');
            expect(result.meta?.total).toBe(2);
        });

        it('should support filter parameters', async () => {
            const mockResponse: JsonApiListResponse<OsfCommentAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            await comments.listByNode('node123', { 'filter[deleted]': 'false' });

            const [url] = fetchMock.mock.calls[0];
            expect(url).toContain('filter%5Bdeleted%5D=false');
        });

        it('should handle empty comment list', async () => {
            const mockResponse: JsonApiListResponse<OsfCommentAttributes> = {
                data: [],
                meta: { total: 0 },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.listByNode('node123');

            expect(result.data).toHaveLength(0);
            expect(result.meta?.total).toBe(0);
        });

        it('should throw OsfNotFoundError for non-existent node', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(comments.listByNode('non-existent')).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('listByNodePaginated(nodeId)', () => {
        it('should return paginated result for node comments', async () => {
            const mockResponse: JsonApiListResponse<OsfCommentAttributes> = {
                data: [
                    {
                        id: 'comment1',
                        type: 'comments',
                        attributes: buildCommentAttributes({ content: 'Paginated comment' }),
                    },
                ],
                meta: { total: 1, per_page: 10 },
                links: {
                    self: 'https://api.osf.io/v2/nodes/node123/comments/',
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.listByNodePaginated('node123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/node123/comments/');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].content).toBe('Paginated comment');
        });
    });

    describe('create(nodeId, data)', () => {
        it('should create a comment on a node', async () => {
            const mockResponse: JsonApiResponse<OsfCommentAttributes> = {
                data: {
                    id: 'new-comment',
                    type: 'comments',
                    attributes: buildCommentAttributes({
                        content: 'New comment on node',
                    }),
                    links: {
                        self: 'https://api.osf.io/v2/comments/new-comment/',
                    },
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.create('node123', { content: 'New comment on node' });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/node123/comments/');
            expect(options?.method).toBe('POST');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('comments');
            expect(body.data.attributes.content).toBe('New comment on node');
            expect(body.data.relationships.target.data.type).toBe('nodes');
            expect(body.data.relationships.target.data.id).toBe('node123');

            expect(result.id).toBe('new-comment');
            expect(result.content).toBe('New comment on node');
        });

        it('should create a reply to another comment', async () => {
            const mockResponse: JsonApiResponse<OsfCommentAttributes> = {
                data: {
                    id: 'reply-comment',
                    type: 'comments',
                    attributes: buildCommentAttributes({
                        content: 'Reply to comment',
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.create('node123', {
                content: 'Reply to comment',
                target_id: 'parent-comment',
                target_type: 'comments',
            });

            const [, options] = fetchMock.mock.calls[0];
            const body = JSON.parse(options?.body as string);
            expect(body.data.relationships.target.data.type).toBe('comments');
            expect(body.data.relationships.target.data.id).toBe('parent-comment');

            expect(result.id).toBe('reply-comment');
            expect(result.content).toBe('Reply to comment');
        });

        it('should throw OsfPermissionError without write access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(comments.create('node123', { content: 'test' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('update(id, data)', () => {
        it('should update a comment', async () => {
            const mockResponse: JsonApiResponse<OsfCommentAttributes> = {
                data: {
                    id: 'comment123',
                    type: 'comments',
                    attributes: buildCommentAttributes({
                        content: 'Updated content',
                        modified: true,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.update('comment123', { content: 'Updated content' });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/comments/comment123/');
            expect(options?.method).toBe('PATCH');

            const body = JSON.parse(options?.body as string);
            expect(body.data.type).toBe('comments');
            expect(body.data.id).toBe('comment123');
            expect(body.data.attributes.content).toBe('Updated content');

            expect(result.id).toBe('comment123');
            expect(result.content).toBe('Updated content');
            expect(result.modified).toBe(true);
        });

        it('should undelete a comment by setting deleted to false', async () => {
            const mockResponse: JsonApiResponse<OsfCommentAttributes> = {
                data: {
                    id: 'comment123',
                    type: 'comments',
                    attributes: buildCommentAttributes({
                        deleted: false,
                    }),
                },
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await comments.update('comment123', { deleted: false });

            const [, options] = fetchMock.mock.calls[0];
            const body = JSON.parse(options?.body as string);
            expect(body.data.attributes.deleted).toBe(false);

            expect(result.deleted).toBe(false);
        });

        it('should throw OsfNotFoundError for non-existent comment', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(comments.update('non-existent', { content: 'test' })).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without edit access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(comments.update('comment123', { content: 'test' })).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('delete(id)', () => {
        it('should delete a comment', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await comments.delete('comment123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/comments/comment123/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfNotFoundError for non-existent comment', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

            await expect(comments.delete('non-existent')).rejects.toThrow(OsfNotFoundError);
        });

        it('should throw OsfPermissionError without delete access', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
                status: 403,
            });

            await expect(comments.delete('comment123')).rejects.toThrow(OsfPermissionError);
        });
    });
});
