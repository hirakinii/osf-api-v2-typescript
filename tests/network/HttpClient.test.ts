import { HttpClient } from '../../src/network/HttpClient';
import {
    OsfAuthenticationError,
    OsfPermissionError,
    OsfNotFoundError,
    OsfRateLimitError,
    OsfServerError,
    OsfApiError,
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

    it('should use provided full URL when host is allowed', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
        const fullUrl = 'https://api.test-osf.io/v2/nodes';
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

    describe('post()', () => {
        it('should send POST request with JSON body', async () => {
            const mockResponse = { data: { id: 'new-123', type: 'nodes' } };
            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const body = { data: { type: 'nodes', attributes: { title: 'Test' } } };
            const result = await client.post('nodes/', body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/');
            expect(options?.method).toBe('POST');
            expect(options?.body).toBe(JSON.stringify(body));
            expect(result).toEqual(mockResponse);
        });

        it('should throw error on POST failure', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 400 });
            await expect(client.post('nodes/', {})).rejects.toThrow();
        });
    });

    describe('patch()', () => {
        it('should send PATCH request with JSON body', async () => {
            const mockResponse = { data: { id: 'abc12', type: 'nodes' } };
            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const body = { data: { type: 'nodes', id: 'abc12', attributes: { title: 'Updated' } } };
            const result = await client.patch('nodes/abc12/', body);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/');
            expect(options?.method).toBe('PATCH');
            expect(options?.body).toBe(JSON.stringify(body));
            expect(result).toEqual(mockResponse);
        });

        it('should throw OsfNotFoundError on 404', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 404 });
            await expect(client.patch('nodes/unknown/', {})).rejects.toThrow(OsfNotFoundError);
        });
    });

    describe('delete()', () => {
        it('should send DELETE request', async () => {
            fetchMock.mockResponseOnce('', { status: 204 });

            await client.delete('nodes/abc12/');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.test-osf.io/v2/nodes/abc12/');
            expect(options?.method).toBe('DELETE');
        });

        it('should throw OsfPermissionError on 403', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 403 });
            await expect(client.delete('nodes/abc12/')).rejects.toThrow(OsfPermissionError);
        });
    });

    describe('put()', () => {
        let fileClient: HttpClient;

        beforeEach(() => {
            fileClient = new HttpClient({ token, baseUrl, allowedHosts: ['files.osf.io'] });
        });

        it('should send PUT request with binary body', async () => {
            const mockResponse = { data: { id: 'file-123', type: 'files' } };
            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const binaryData = new ArrayBuffer(10);
            const result = await fileClient.put('https://files.osf.io/v1/upload', binaryData);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://files.osf.io/v1/upload');
            expect(options?.method).toBe('PUT');
            const headers = options?.headers as Headers;
            expect(headers.get('Content-Type')).toBe('application/octet-stream');
            expect(result).toEqual(mockResponse);
        });

        it('should send PUT request with Uint8Array body', async () => {
            const mockResponse = { data: { id: 'file-456', type: 'files' } };
            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const uint8Data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
            const result = await fileClient.put('https://files.osf.io/v1/upload', uint8Data);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://files.osf.io/v1/upload');
            expect(options?.method).toBe('PUT');
            const headers = options?.headers as Headers;
            expect(headers.get('Content-Type')).toBe('application/octet-stream');
            expect(result).toEqual(mockResponse);
        });

        it('should allow custom Content-Type header', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));

            await fileClient.put('https://files.osf.io/v1/upload', 'test', {
                headers: { 'Content-Type': 'text/plain' },
            });

            const [, options] = fetchMock.mock.calls[0];
            const headers = options?.headers as Headers;
            expect(headers.get('Content-Type')).toBe('text/plain');
        });
    });

    describe('getRaw()', () => {
        let fileClient: HttpClient;

        beforeEach(() => {
            fileClient = new HttpClient({ token, baseUrl, allowedHosts: ['files.osf.io'] });
        });

        it('should return ArrayBuffer for binary download', async () => {
            // Use a simple string that will be converted to ArrayBuffer
            const binaryString = 'Hello';
            fetchMock.mockResponseOnce(binaryString, {
                headers: { 'Content-Type': 'application/octet-stream' },
            });

            const result = await fileClient.getRaw('https://files.osf.io/v1/download/abc123');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toBe('https://files.osf.io/v1/download/abc123');
            expect(options?.method).toBe('GET');
            expect(result).toBeInstanceOf(ArrayBuffer);
        });

        it('should throw error on download failure', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ errors: [] }), { status: 404 });
            await expect(fileClient.getRaw('https://files.osf.io/v1/download/unknown')).rejects.toThrow(
                OsfNotFoundError
            );
        });
    });

    describe('tokenProvider', () => {
        it('should resolve token dynamically from tokenProvider', async () => {
            const tokenProvider = jest.fn().mockReturnValue('dynamic-token');
            const providerClient = new HttpClient({ tokenProvider, baseUrl });
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));

            await providerClient.get('nodes/12345');

            const [, options] = fetchMock.mock.calls[0];
            const headers = options?.headers as Headers;
            expect(headers.get('Authorization')).toBe('Bearer dynamic-token');
            expect(tokenProvider).toHaveBeenCalledTimes(1);
        });

        it('should support async tokenProvider', async () => {
            const tokenProvider = jest.fn().mockResolvedValue('async-token');
            const providerClient = new HttpClient({ tokenProvider, baseUrl });
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));

            await providerClient.get('nodes/12345');

            const [, options] = fetchMock.mock.calls[0];
            const headers = options?.headers as Headers;
            expect(headers.get('Authorization')).toBe('Bearer async-token');
        });

        it('should call tokenProvider on every request', async () => {
            let callCount = 0;
            const tokenProvider = jest.fn().mockImplementation(() => `token-${++callCount}`);
            const providerClient = new HttpClient({ tokenProvider, baseUrl });

            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await providerClient.get('nodes/1');

            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await providerClient.get('nodes/2');

            expect(tokenProvider).toHaveBeenCalledTimes(2);
            const headers1 = (fetchMock.mock.calls[0][1]?.headers as Headers);
            const headers2 = (fetchMock.mock.calls[1][1]?.headers as Headers);
            expect(headers1.get('Authorization')).toBe('Bearer token-1');
            expect(headers2.get('Authorization')).toBe('Bearer token-2');
        });

        it('should throw error when neither token nor tokenProvider is provided', () => {
            expect(() => new HttpClient({ baseUrl })).toThrow(
                'Either token or tokenProvider must be provided'
            );
        });
    });

    describe('Timeout handling', () => {
        it('should use default timeout of 30 seconds', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await client.get('nodes');

            const [, options] = fetchMock.mock.calls[0];
            expect(options?.signal).toBeDefined();
        });

        it('should allow custom timeout configuration', async () => {
            const customClient = new HttpClient({ token, baseUrl, timeout: 5000 });
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await customClient.get('nodes');

            const [, options] = fetchMock.mock.calls[0];
            expect(options?.signal).toBeDefined();
        });

        it('should throw error when request times out', async () => {
            const shortTimeoutClient = new HttpClient({ token, baseUrl, timeout: 100 });

            // Mock a delayed response that will be aborted
            fetchMock.mockImplementation(() =>
                new Promise((_, reject) => {
                    setTimeout(() => {
                        const error = new Error('The operation was aborted');
                        error.name = 'AbortError';
                        reject(error);
                    }, 50);
                })
            );

            await expect(shortTimeoutClient.get('nodes')).rejects.toThrow('Request timeout after 100ms');
        });

        it('should allow per-request timeout override', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await client.get('nodes', { signal: AbortSignal.timeout(1000) });

            const [, options] = fetchMock.mock.calls[0];
            expect(options?.signal).toBeDefined();
        });
    });

    describe('URL host validation', () => {
        it('should allow requests to the base URL host', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await client.get('https://api.test-osf.io/v2/nodes');

            expect(fetchMock.mock.calls[0][0]).toBe('https://api.test-osf.io/v2/nodes');
        });

        it('should throw OsfApiError for disallowed hosts', async () => {
            await expect(client.get('https://evil.example.com/v2/nodes')).rejects.toThrow(OsfApiError);
            await expect(client.get('https://evil.example.com/v2/nodes')).rejects.toThrow(
                'Request to disallowed host: evil.example.com',
            );
        });

        it('should allow additional hosts via allowedHosts config', async () => {
            const clientWithExtra = new HttpClient({
                token,
                baseUrl,
                allowedHosts: ['files.osf.io'],
            });
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await clientWithExtra.get('https://files.osf.io/v1/download/abc123');

            expect(fetchMock.mock.calls[0][0]).toBe('https://files.osf.io/v1/download/abc123');
        });

        it('should still resolve relative paths normally', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));
            await client.get('nodes/12345');

            expect(fetchMock.mock.calls[0][0]).toBe('https://api.test-osf.io/v2/nodes/12345');
        });
    });
});
