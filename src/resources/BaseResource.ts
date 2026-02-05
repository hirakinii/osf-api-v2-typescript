import { HttpClient } from '../network/HttpClient';
import { JsonApiAdapter, TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { JsonApiResponse, JsonApiListResponse } from '../types';

/**
 * Base class for all resource classes
 * Provides common functionality for interacting with JSON:API endpoints
 */
export abstract class BaseResource {
  protected httpClient: HttpClient;
  protected adapter: JsonApiAdapter;

  /**
   * Create a new resource instance
   *
   * @param httpClient - HTTP client for making API requests
   */
  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.adapter = new JsonApiAdapter();
  }

  /**
   * Fetch a single resource from the API
   *
   * @param endpoint - API endpoint path
   * @returns Transformed resource with flattened attributes
   */
  protected async get<T>(endpoint: string): Promise<TransformedResource<T>> {
    const response = await this.httpClient.get<JsonApiResponse<T>>(endpoint);
    return this.adapter.transformSingle<T>(response);
  }

  /**
   * Fetch a list of resources from the API
   *
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @returns Transformed list with metadata and pagination links
   */
  protected async list<T>(endpoint: string, params?: Record<string, unknown>): Promise<TransformedList<T>> {
    const queryString = params ? this.buildQueryString(params) : '';
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const response = await this.httpClient.get<JsonApiListResponse<T>>(url);
    return this.adapter.transformList<T>(response);
  }

  /**
   * Build a query string from parameters object
   *
   * @param params - Parameters to serialize
   * @returns URL-encoded query string
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    return searchParams.toString();
  }
}
