import { HttpClient } from '../../src/network/HttpClient';
import {
    OsfAuthenticationError,
    OsfPermissionError,
    OsfNotFoundError,
    OsfRateLimitError,
    OsfServerError,
} from '../../src/network/Errors';
import fetchMock from 'jest-fetch-mock';

describe('HttpClient', () => {
    const token = 'test-token';
    const baseUrl = 'https://api.test-osf.io/v2/';
    let client: HttpClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        client = new HttpClient({ token, baseUrl });
    });

    it('should attach correct Authorization header', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
        await client.get('nodes/12345');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        // Normalize URL checking
        expect(url).toBe('https://api.test-osf.io/v2/nodes/12345');
        const headers = options?.headers as Headers;
        expect(headers.get('Authorization')).toBe('Bearer test-token');
        expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should not overwrite Content-Type if provided', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
        await client.get('nodes', { headers: { 'Content-Type': 'text/plain' } });

        const [, options] = fetchMock.mock.calls[0];
        const headers = options?.headers as Headers;
        expect(headers.get('Content-Type')).toBe('text/plain');
    });

    it('should use provided full URL', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
        const fullUrl = 'https://other-domain.com/v2/nodes';
        await client.get(fullUrl);

        expect(fetchMock.mock.calls[0][0]).toBe(fullUrl);
    });

    it('should return empty object on 204 No Content', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });
        const result = await client.get('nodes');
        expect(result).toEqual({});
    });

    it('should handle error with custom detail message', async () => {
        const errorDetail = 'Custom error message';
        fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: errorDetail }] }), { status: 400 });
        await expect(client.get('nodes')).rejects.toThrow(errorDetail);
    });

    it('should fallback to status text if error body is invalid/empty', async () => {
        fetchMock.mockResponseOnce('invalid json', { status: 500, statusText: 'Internal Error' });
        await expect(client.get('nodes')).rejects.toThrow('HTTP Error 500 Internal Error');
    });


    it('should use default base URL if not provided', async () => {
        const clientWithDefault = new HttpClient({ token });
        fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
        await clientWithDefault.get('nodes');

        expect(fetchMock.mock.calls[0][0]).toBe('https://api.osf.io/v2/nodes');
    });

    it('should return JSON data on 200 OK', async () => {
        const mockData = { id: '1', type: 'nodes' };
        fetchMock.mockResponseOnce(JSON.stringify({ data: mockData }));

        const result = await client.get<any>('nodes/1');
        expect(result).toEqual({ data: mockData });
    });

    it('should throw OsfAuthenticationError on 401', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 401 });
        await expect(client.get('nodes')).rejects.toThrow(OsfAuthenticationError);
    });

    it('should throw OsfPermissionError on 403', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 403 });
        await expect(client.get('nodes')).rejects.toThrow(OsfPermissionError);
    });

    it('should throw OsfNotFoundError on 404', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 404 });
        await expect(client.get('nodes/unknown')).rejects.toThrow(OsfNotFoundError);
    });

    it('should throw OsfRateLimitError on 429', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 429 });
        await expect(client.get('nodes')).rejects.toThrow(OsfRateLimitError);
    });

    it('should throw OsfServerError on 500', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 500 });
        await expect(client.get('nodes')).rejects.toThrow(OsfServerError);
    });
});
