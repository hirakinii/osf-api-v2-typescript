import { OsfClient } from '../src';

/**
 * Example demonstrating Preprint operations:
 * - List published preprints with filters
 * - Get a specific preprint by ID
 * - List contributors and files of a preprint
 * - Get citation in various styles
 * - Paginate through preprints
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/preprints.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List published preprints
    console.log('Fetching published preprints...');
    const preprints = await client.preprints.listPreprints({
      'filter[is_published]': true,
    });

    console.log(`Found ${preprints.data.length} preprints:`);
    preprints.data.forEach((pp) => {
      console.log(`  - [${pp.id}] ${pp.title}`);
      console.log(`    DOI: ${pp.doi || '(none)'}`);
      console.log(`    Published: ${pp.date_published || '(not yet)'}`);
    });

    if (preprints.data.length === 0) {
      console.log('No preprints found. Exiting.');
      return;
    }

    // 2. Get a single preprint by ID
    const firstPp = preprints.data[0];
    console.log(`\nFetching preprint ${firstPp.id} details...`);
    const detail = await client.preprints.getById(firstPp.id);
    console.log('--- Preprint Detail ---');
    console.log(`Title: ${detail.title}`);
    console.log(`Description: ${detail.description?.substring(0, 100) || '(none)'}...`);
    console.log(`Tags: ${detail.tags?.join(', ') || '(none)'}`);
    console.log(`Reviews State: ${detail.reviews_state}`);
    console.log(`Version: ${detail.version}`);

    // 3. List contributors of the preprint
    console.log(`\nFetching contributors of preprint ${firstPp.id}...`);
    const contributors = await client.preprints.listContributors(firstPp.id);
    console.log(`Found ${contributors.data.length} contributors.`);

    // 4. List files of the preprint
    console.log(`\nFetching files of preprint ${firstPp.id}...`);
    const files = await client.preprints.listFiles(firstPp.id);
    console.log(`Found ${files.data.length} file providers.`);

    // 5. Get citation in APA style
    console.log(`\nFetching APA citation for preprint ${firstPp.id}...`);
    const citation = await client.preprints.getCitation(firstPp.id, 'apa');
    console.log('Citation:', JSON.stringify(citation, null, 2));

    // 6. Paginate through preprints
    console.log('\n--- Paginated Preprint Listing ---');
    const paginated = await client.preprints.listPreprintsPaginated({
      'filter[is_published]': true,
    });

    let count = 0;
    for await (const pp of paginated.items()) {
      console.log(`${++count}. [${pp.id}] ${pp.title}`);
      if (count >= 10) {
        console.log('... reached demo limit of 10 items.');
        break;
      }
    }
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
