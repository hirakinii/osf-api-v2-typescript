import {
  OsfAuthenticationError,
  OsfPermissionError,
  OsfNotFoundError,
  OsfRateLimitError,
  OsfServerError,
  OsfApiError,
} from './Errors';

export interface HttpClientConfig {
  token: string;
  baseUrl?: string;
  timeout?: number; // Timeout in milliseconds (default: 30000)
}

export class HttpClient {
  private token: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: HttpClientConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.osf.io/v2/';
    this.timeout = config.timeout ?? 30000; // Default: 30 seconds
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<void> {
    await this.request<void>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PUT request for binary uploads (Waterbutler API)
   * Content-Type defaults to application/octet-stream
   */
  async put<T>(endpoint: string, body: ArrayBuffer | Blob | Buffer | string, options: RequestInit = {}): Promise<T> {
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

    headers.set('Authorization', `Bearer ${this.token}`);

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

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = this.resolveUrl(endpoint);
    const headers = new Headers(options.headers);

    headers.set('Authorization', `Bearer ${this.token}`);
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
      case 429:
        throw new OsfRateLimitError(errorMessage);
      default:
        if (response.status >= 500) {
          throw new OsfServerError(errorMessage);
        }
        throw new OsfApiError(errorMessage);
    }
  }
}
