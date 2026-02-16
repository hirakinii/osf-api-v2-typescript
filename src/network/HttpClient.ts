import {
  OsfAuthenticationError,
  OsfPermissionError,
  OsfNotFoundError,
  OsfRateLimitError,
  OsfServerError,
  OsfApiError,
} from './Errors';

/**
 * Configuration options for the HttpClient
 */
export interface HttpClientConfig {
  /** Static token string (PAT or OAuth2 access token) */
  token?: string;
  /** Dynamic token provider function (for OAuth2 auto-refresh) */
  tokenProvider?: () => string | Promise<string>;
  /** Base URL for the API (defaults to https://api.osf.io/v2/) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
  /** Optional list of additional allowed hostnames for full-URL requests */
  allowedHosts?: string[];
}

/**
 * Common HTTP client for making requests to OSF APIs.
 * Handles authentication, base URL resolution, and error mapping.
 */
export class HttpClient {
  private token?: string;
  private tokenProvider?: () => string | Promise<string>;
  private baseUrl: string;
  private timeout: number;
  private allowedHosts: Set<string>;

  constructor(config: HttpClientConfig) {
    if (!config.token && !config.tokenProvider) {
      throw new Error('Either token or tokenProvider must be provided');
    }
    this.token = config.token;
    this.tokenProvider = config.tokenProvider;
    this.baseUrl = config.baseUrl || 'https://api.osf.io/v2/';
    this.timeout = config.timeout ?? 30000; // Default: 30 seconds
    const baseHost = new URL(this.baseUrl).hostname;
    this.allowedHosts = new Set([baseHost, ...(config.allowedHosts ?? [])]);
  }

  private async getToken(): Promise<string> {
    if (this.tokenProvider) {
      return this.tokenProvider();
    }
    return this.token!;
  }

  /**
   * Perform a GET request
   *
   * @param endpoint - The API endpoint path or full URL
   * @param options - Additional request options
   * @returns The parsed JSON response
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Perform a POST request
   *
   * @param endpoint - The API endpoint path or full URL
   * @param body - The request body (will be stringified)
   * @param options - Additional request options
   * @returns The parsed JSON response
   */
  async post<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Perform a PATCH request
   *
   * @param endpoint - The API endpoint path or full URL
   * @param body - The request body (will be stringified)
   * @param options - Additional request options
   * @returns The parsed JSON response
   */
  async patch<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * Perform a DELETE request
   *
   * @param endpoint - The API endpoint path or full URL
   * @param options - Additional request options
   */
  async delete(endpoint: string, options: RequestInit = {}): Promise<void> {
    await this.request<void>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PUT request for binary uploads (Waterbutler API)
   * Content-Type defaults to application/octet-stream
   */
  async put<T>(
    endpoint: string,
    body: ArrayBuffer | Blob | Uint8Array | string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/octet-stream');
    }

    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body as BodyInit,
      headers,
    });
  }

  /**
   * GET request that returns raw binary data (for file downloads)
   */
  async getRaw(endpoint: string, options: RequestInit = {}): Promise<ArrayBuffer> {
    const url = this.resolveUrl(endpoint);
    const headers = new Headers(options.headers);

    const token = await this.getToken();
    headers.set('Authorization', `Bearer ${token}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers,
        signal: options.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      return response.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OsfApiError(`Request timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * PUT request for binary uploads that returns JSON response (Waterbutler API)
   *
   * Similar to put(), but explicitly designed for binary data uploads.
   * Content-Type defaults to application/octet-stream.
   *
   * @param endpoint - The API endpoint path or full URL
   * @param body - Binary data to upload
   * @param options - Additional request options
   * @returns The parsed JSON response
   */
  async putRaw<T>(
    endpoint: string,
    body: ArrayBuffer | Buffer | Blob | Uint8Array,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/octet-stream');
    }

    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body as BodyInit,
      headers,
    });
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = this.resolveUrl(endpoint);
    const headers = new Headers(options.headers);

    const token = await this.getToken();
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Setup timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OsfApiError(`Request timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      const url = new URL(endpoint);
      if (!this.allowedHosts.has(url.hostname)) {
        throw new OsfApiError(
          `Request to disallowed host: ${url.hostname}. Allowed: ${[...this.allowedHosts].join(', ')}`,
        );
      }
      return endpoint;
    }
    return new URL(endpoint, this.baseUrl).toString();
  }

  private async handleError(response: Response): Promise<never> {
    let errorMessage = `HTTP Error ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.errors && errorBody.errors.length > 0) {
        errorMessage = errorBody.errors[0].detail || errorMessage;
      }
    } catch {
      // ignore JSON parse error
    }

    switch (response.status) {
      case 401:
        throw new OsfAuthenticationError(errorMessage);
      case 403:
        throw new OsfPermissionError(errorMessage);
      case 404:
        throw new OsfNotFoundError(errorMessage);
      case 429: {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        throw new OsfRateLimitError(errorMessage, Number.isNaN(retryAfter) ? undefined : retryAfter);
      }
      default:
        if (response.status >= 500) {
          throw new OsfServerError(errorMessage);
        }
        throw new OsfApiError(errorMessage);
    }
  }
}
