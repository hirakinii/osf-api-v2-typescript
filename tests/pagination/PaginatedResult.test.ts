import { PaginatedResult, PageFetcher } from '../../src/pagination/PaginatedResult';
import { TransformedList, TransformedResource } from '../../src/adapter/JsonApiAdapter';

interface TestItem {
  title: string;
}

describe('PaginatedResult', () => {
  describe('single page access', () => {
    it('should return data from first page', () => {
      const page: TransformedList<TestItem> = {
        data: [
          { id: '1', type: 'test', title: 'Item 1' },
          { id: '2', type: 'test', title: 'Item 2' },
        ],
        meta: { total: 2, per_page: 10 },
      };

      const fetcher: PageFetcher<TestItem> = jest.fn();
      const result = new PaginatedResult(page, fetcher);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Item 1');
      expect(result.data[1].title).toBe('Item 2');
    });

    it('should expose meta information', () => {
      const page: TransformedList<TestItem> = {
        data: [],
        meta: { total: 100, per_page: 10 },
      };

      const result = new PaginatedResult(page, jest.fn());

      expect(result.meta?.total).toBe(100);
      expect(result.meta?.per_page).toBe(10);
    });

    it('should expose links', () => {
      const page: TransformedList<TestItem> = {
        data: [],
        links: {
          self: 'https://api.osf.io/v2/nodes/?page=1',
          first: 'https://api.osf.io/v2/nodes/?page=1',
          last: 'https://api.osf.io/v2/nodes/?page=5',
          next: 'https://api.osf.io/v2/nodes/?page=2',
        },
      };

      const result = new PaginatedResult(page, jest.fn());

      expect(result.links?.self).toBe('https://api.osf.io/v2/nodes/?page=1');
      expect(result.links?.next).toBe('https://api.osf.io/v2/nodes/?page=2');
    });

    it('should indicate hasNext when next link exists', () => {
      const pageWithNext: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
        links: { next: 'https://api.osf.io/v2/nodes/?page=2' },
      };

      const pageWithoutNext: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
        links: {},
      };

      const pageNoLinks: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
      };

      expect(new PaginatedResult(pageWithNext, jest.fn()).hasNext).toBe(true);
      expect(new PaginatedResult(pageWithoutNext, jest.fn()).hasNext).toBe(false);
      expect(new PaginatedResult(pageNoLinks, jest.fn()).hasNext).toBe(false);
    });
  });

  describe('multi-page iteration', () => {
    it('should iterate through all pages using for await...of', async () => {
      const page1: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
        links: { next: 'https://api.osf.io/v2/nodes/?page=2' },
        meta: { total: 3 },
      };

      const page2: TransformedList<TestItem> = {
        data: [{ id: '2', type: 'test', title: 'Item 2' }],
        links: { next: 'https://api.osf.io/v2/nodes/?page=3' },
      };

      const page3: TransformedList<TestItem> = {
        data: [{ id: '3', type: 'test', title: 'Item 3' }],
        links: {}, // No next link - last page
      };

      const fetcher = jest
        .fn<Promise<TransformedList<TestItem>>, [string]>()
        .mockResolvedValueOnce(page2)
        .mockResolvedValueOnce(page3);

      const result = new PaginatedResult(page1, fetcher);
      const pages: TransformedResource<TestItem>[][] = [];

      for await (const page of result) {
        pages.push(page);
      }

      expect(pages).toHaveLength(3);
      expect(pages[0][0].id).toBe('1');
      expect(pages[1][0].id).toBe('2');
      expect(pages[2][0].id).toBe('3');
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(fetcher).toHaveBeenNthCalledWith(1, 'https://api.osf.io/v2/nodes/?page=2');
      expect(fetcher).toHaveBeenNthCalledWith(2, 'https://api.osf.io/v2/nodes/?page=3');
    });

    it('should iterate through all items with items()', async () => {
      const page1: TransformedList<TestItem> = {
        data: [
          { id: '1', type: 'test', title: 'Item 1' },
          { id: '2', type: 'test', title: 'Item 2' },
        ],
        links: { next: 'https://api.osf.io/v2/nodes/?page=2' },
      };

      const page2: TransformedList<TestItem> = {
        data: [{ id: '3', type: 'test', title: 'Item 3' }],
      };

      const fetcher = jest.fn<Promise<TransformedList<TestItem>>, [string]>().mockResolvedValueOnce(page2);
      const result = new PaginatedResult(page1, fetcher);
      const items: TransformedResource<TestItem>[] = [];

      for await (const item of result.items()) {
        items.push(item);
      }

      expect(items).toHaveLength(3);
      expect(items[0].id).toBe('1');
      expect(items[1].id).toBe('2');
      expect(items[2].id).toBe('3');
    });

    it('should collect all items with toArray()', async () => {
      const page1: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
        links: { next: 'https://api.osf.io/v2/nodes/?page=2' },
      };

      const page2: TransformedList<TestItem> = {
        data: [{ id: '2', type: 'test', title: 'Item 2' }],
      };

      const fetcher = jest.fn<Promise<TransformedList<TestItem>>, [string]>().mockResolvedValueOnce(page2);
      const result = new PaginatedResult(page1, fetcher);

      const allItems = await result.toArray();

      expect(allItems).toHaveLength(2);
      expect(allItems[0].id).toBe('1');
      expect(allItems[1].id).toBe('2');
    });
  });

  describe('edge cases', () => {
    it('should handle empty first page', async () => {
      const page: TransformedList<TestItem> = {
        data: [],
        meta: { total: 0 },
      };

      const fetcher = jest.fn();
      const result = new PaginatedResult(page, fetcher);
      const pages: TransformedResource<TestItem>[][] = [];

      for await (const p of result) {
        pages.push(p);
      }

      expect(pages).toHaveLength(1);
      expect(pages[0]).toEqual([]);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should not call fetcher if no next link exists', async () => {
      const page: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
      };

      const fetcher = jest.fn();
      const result = new PaginatedResult(page, fetcher);

      for await (const _ of result) {
        // iterate through
      }

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should handle early termination with break', async () => {
      const page1: TransformedList<TestItem> = {
        data: [{ id: '1', type: 'test', title: 'Item 1' }],
        links: { next: 'https://api.osf.io/v2/nodes/?page=2' },
      };

      const page2: TransformedList<TestItem> = {
        data: [{ id: '2', type: 'test', title: 'Item 2' }],
        links: { next: 'https://api.osf.io/v2/nodes/?page=3' },
      };

      const fetcher = jest.fn<Promise<TransformedList<TestItem>>, [string]>().mockResolvedValueOnce(page2);
      const result = new PaginatedResult(page1, fetcher);
      const pages: TransformedResource<TestItem>[][] = [];

      for await (const page of result) {
        pages.push(page);
        if (pages.length === 2) break; // Early termination
      }

      expect(pages).toHaveLength(2);
      expect(fetcher).toHaveBeenCalledTimes(1); // Only fetched page 2, not page 3
    });

    it('should handle pages with multiple items', async () => {
      const page1: TransformedList<TestItem> = {
        data: [
          { id: '1', type: 'test', title: 'Item 1' },
          { id: '2', type: 'test', title: 'Item 2' },
          { id: '3', type: 'test', title: 'Item 3' },
        ],
        links: { next: 'https://api.osf.io/v2/nodes/?page=2' },
      };

      const page2: TransformedList<TestItem> = {
        data: [
          { id: '4', type: 'test', title: 'Item 4' },
          { id: '5', type: 'test', title: 'Item 5' },
        ],
      };

      const fetcher = jest.fn<Promise<TransformedList<TestItem>>, [string]>().mockResolvedValueOnce(page2);
      const result = new PaginatedResult(page1, fetcher);

      const allItems = await result.toArray();

      expect(allItems).toHaveLength(5);
    });
  });
});
