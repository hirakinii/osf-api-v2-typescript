import { OsfClient } from '../src';

/**
 * Example demonstrating the automatic pagination feature.
 *
 * Instead of manually handling page offsets, you can use the PaginatedResult
 * which supports async iteration over all items or all pages.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/pagination_demo.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    console.log('Fetching public nodes using automatic pagination...');

    // 1. Get a PaginatedResult
    const result = await client.nodes.listNodesPaginated({
      'filter[public]': true,
      'page[size]': 10, // Small page size to demonstrate multiple requests
    });

    console.log('--- Iterating through items (limit to 25 items for demo) ---');
    let count = 0;

    // 2. Iterate through items across all pages
    for await (const node of result.items()) {
      console.log(`${++count}. [${node.id}] ${node.title}`);

      if (count >= 25) {
        console.log('... reached demo limit of 25 items.');
        break;
      }
    }

    console.log('\n--- Iterating through pages ---');
    // Re-fetch to reset generator or just get a new one
    const pageResult = await client.nodes.listNodesPaginated({
      'filter[public]': true,
      'page[size]': 20,
    });

    let pageCount = 0;
    for await (const page of pageResult) {
      pageCount++;
      console.log(`Page ${pageCount}: Got ${page.length} nodes.`);

      if (pageCount >= 3) {
        console.log('... reached demo limit of 3 pages.');
        break;
      }
    }
  } catch (error) {
    console.error('Error during pagination demo:', error);
  }
}

main();
