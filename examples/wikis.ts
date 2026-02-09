import { OsfClient } from '../src';

/**
 * Example demonstrating Wiki operations:
 * - Get a wiki page by ID
 * - Get wiki content (markdown)
 * - List wiki versions
 * - Create a new wiki version
 *
 * Note: Wikis are accessed via node wiki pages. You need an existing
 * wiki page ID. You can discover wiki IDs by listing node wikis through
 * the Nodes API (e.g., GET /v2/nodes/{node_id}/wikis/).
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * export WIKI_ID='your-wiki-id'
 * npx ts-node examples/wikis.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const wikiId = process.env.WIKI_ID;
  if (!wikiId) {
    console.error('WIKI_ID is required. Set it via: export WIKI_ID="your-wiki-id"');
    console.log('You can find wiki IDs by listing wikis on a node.');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. Get wiki page metadata
    console.log(`Fetching wiki ${wikiId}...`);
    const wiki = await client.wikis.getById(wikiId);
    console.log('--- Wiki Page ---');
    console.log(`Name: ${wiki.name}`);
    console.log(`Path: ${wiki.materialized_path}`);
    console.log(`Kind: ${wiki.kind}`);
    console.log(`Size: ${wiki.size} bytes`);
    console.log(`Content Type: ${wiki.content_type}`);
    console.log(`Last Modified: ${wiki.date_modified}`);

    // 2. Get wiki content (markdown)
    console.log('\nFetching wiki content...');
    const content = await client.wikis.getContent(wikiId);
    console.log('--- Wiki Content (first 500 chars) ---');
    console.log(content.substring(0, 500));
    if (content.length > 500) {
      console.log(`... (${content.length} total characters)`);
    }

    // 3. List wiki versions
    console.log('\nFetching wiki versions...');
    const versions = await client.wikis.listVersions(wikiId);
    console.log(`Found ${versions.data.length} versions:`);
    versions.data.forEach((ver, i) => {
      console.log(`  Version ${i + 1}:`);
      console.log(`    Size: ${ver.size} bytes`);
      console.log(`    Created: ${ver.date_created}`);
      console.log(`    Content Type: ${ver.content_type}`);
    });

    // 4. Create a new wiki version
    // Uncomment the following to create a new version:
    // console.log('\nCreating a new wiki version...');
    // const newVersion = await client.wikis.createVersion(wikiId, '# Updated Wiki\n\nThis content was updated via the API.');
    // console.log('New version created:');
    // console.log(`  Size: ${newVersion.size} bytes`);
    // console.log(`  Created: ${newVersion.date_created}`);
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
