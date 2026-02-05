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
}

export class HttpClient {
  private token: string;
  private baseUrl: string;

  constructor(config: HttpClientConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.osf.io/v2/';
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = this.resolveUrl(endpoint);
    const headers = new Headers(options.headers);

    headers.set('Authorization', `Bearer ${this.token}`);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
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
    } catch (e) {
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
