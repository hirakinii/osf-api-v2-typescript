import { OsfClient } from '../src';

/**
 * Basic usage example of the OSF API v2 client.
 *
 * To run this example:
 * 1. Set your OSF Personal Access Token as an environment variable:
 *    export OSF_TOKEN='your-personal-access-token'
 * 2. Run with ts-node:
 *    npx ts-node examples/basic_usage.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;

  if (!token) {
    console.error('Error: OSF_TOKEN environment variable is not set.');
    console.log('Please set it using: export OSF_TOKEN="your-token"');
    process.exit(1);
  }

  // 1. Initialize the client
  const client = new OsfClient({
    token: token,
    // baseUrl: 'https://api.osf.io/v2/', // Optional, defaults to production
  });

  try {
    // 2. Get the currently authenticated user
    console.log('Fetching your OSF profile...');
    const me = await client.users.me();

    console.log('--- User Profile ---');
    console.log(`ID: ${me.id}`);
    console.log(`Name: ${me.full_name}`);
    console.log(`Active: ${me.active}`);
    console.log(`Locale: ${me.locale || 'Not specified'}`);
    console.log(`Profile URL: ${me.links?.html}`);
    console.log('--------------------');

    // 3. List some public nodes
    console.log('\nFetching some public nodes...');
    const publicNodes = await client.nodes.listNodes({
      'filter[public]': true,
      'page[size]': 5,
    });

    console.log(`Found ${publicNodes.data.length} public nodes:`);
    publicNodes.data.forEach((node) => {
      // Attributes are flattened into the top level
      console.log(`- [${node.id}] ${node.title} (${node.category})`);
    });
  } catch (error) {
    console.error('An error occurred:', error instanceof Error ? error.message : error);
  }
}

main();
