import { TransformedList, TransformedResource } from '../adapter/JsonApiAdapter';

/**
 * Function type for fetching a page from a URL
 */
export type PageFetcher<T> = (url: string) => Promise<TransformedList<T>>;

/**
 * A paginated result that supports async iteration over pages
 *
 * Wraps a TransformedList and provides methods to:
 * - Access the first page data, meta, and links directly
 * - Iterate over all pages using `for await...of`
 * - Iterate over all items using `items()`
 * - Collect all items into an array using `toArray()`
 *
 * @example
 * ```typescript
 * const result = await nodes.listNodesPaginated();
 *
 * // Access first page directly
 * console.log(result.data);
 *
 * // Iterate over all pages
 * for await (const page of result) {
 *   console.log(`Got ${page.length} items`);
 * }
 *
 * // Iterate over all items
 * for await (const item of result.items()) {
 *   console.log(item.title);
 * }
 *
 * // Collect all items
 * const allItems = await result.toArray();
 * ```
 */
export class PaginatedResult<T> implements AsyncIterable<TransformedResource<T>[]> {
  private currentPage: TransformedList<T>;
  private fetcher: PageFetcher<T>;

  /**
   * Create a new PaginatedResult
   *
   * @param initialPage - The first page of results
   * @param fetcher - Function to fetch subsequent pages by URL
   */
  constructor(initialPage: TransformedList<T>, fetcher: PageFetcher<T>) {
    this.currentPage = initialPage;
    this.fetcher = fetcher;
  }

  /**
   * Get data from the current/first page
   */
  get data(): TransformedResource<T>[] {
    return this.currentPage.data;
  }

  /**
   * Get metadata (total count, per_page, etc.)
   */
  get meta(): Record<string, unknown> | undefined {
    return this.currentPage.meta;
  }

  /**
   * Get pagination links
   */
  get links(): TransformedList<T>['links'] {
    return this.currentPage.links;
  }

  /**
   * Check if there are more pages available
   */
  get hasNext(): boolean {
    return !!this.currentPage.links?.next;
  }

  /**
   * Async iterator that yields page data arrays
   * Automatically follows `next` links to fetch all pages
   */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<TransformedResource<T>[]> {
    let page = this.currentPage;
    yield page.data;

    while (page.links?.next) {
      page = await this.fetcher(page.links.next);
      yield page.data;
    }
  }

  /**
   * Iterate over all items across all pages
   * Yields individual items rather than page arrays
   */
  async *items(): AsyncIterableIterator<TransformedResource<T>> {
    for await (const pageData of this) {
      for (const item of pageData) {
        yield item;
      }
    }
  }

  /**
   * Collect all items from all pages into a single array
   *
   * Warning: This loads all data into memory. For large datasets,
   * consider using `items()` iterator instead.
   */
  async toArray(): Promise<TransformedResource<T>[]> {
    const allItems: TransformedResource<T>[] = [];
    for await (const item of this.items()) {
      allItems.push(item);
    }
    return allItems;
  }
}
