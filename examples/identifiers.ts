import { OsfClient } from '../src';

/**
 * Example demonstrating Identifier operations:
 * - Get an identifier by ID
 * - List identifiers for a node (DOIs, ARKs, etc.)
 * - List identifiers for a registration
 * - Filter identifiers by category
 * - Paginated identifier listing
 *
 * Identifiers are persistent, unique references (such as DOIs or ARKs)
 * that are assigned to OSF nodes and registrations for citation and
 * discoverability purposes.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/identifiers.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List identifiers for a node
    const nodeId = process.env.NODE_ID;
    if (nodeId) {
      console.log(`Fetching identifiers for node ${nodeId}...`);
      const identifiers = await client.identifiers.listByNode(nodeId);
      console.log(`Found ${identifiers.data.length} identifiers:`);
      identifiers.data.forEach((id, i) => {
        console.log(`  ${i + 1}. [${id.category}] ${id.value}`);
      });

      // 2. Filter identifiers by category (e.g., 'doi')
      console.log('\nFiltering for DOI identifiers...');
      const dois = await client.identifiers.listByNode(nodeId, {
        'filter[category]': 'doi',
      });
      console.log(`Found ${dois.data.length} DOI identifiers:`);
      dois.data.forEach((id) => {
        console.log(`  - ${id.value}`);
      });
    } else {
      console.log('Tip: Set NODE_ID to list identifiers for a specific node.');
    }

    // 3. List identifiers for a registration
    const registrationId = process.env.REGISTRATION_ID;
    if (registrationId) {
      console.log(`\nFetching identifiers for registration ${registrationId}...`);
      const identifiers = await client.identifiers.listByRegistration(registrationId);
      console.log(`Found ${identifiers.data.length} identifiers:`);
      identifiers.data.forEach((id, i) => {
        console.log(`  ${i + 1}. [${id.category}] ${id.value}`);
      });
    } else {
      console.log('Tip: Set REGISTRATION_ID to list identifiers for a registration.');
    }

    // 4. Get a specific identifier by ID
    const identifierId = process.env.IDENTIFIER_ID;
    if (identifierId) {
      console.log(`\nFetching identifier ${identifierId}...`);
      const identifier = await client.identifiers.getById(identifierId);
      console.log('--- Identifier Details ---');
      console.log(`Category: ${identifier.category}`);
      console.log(`Value: ${identifier.value}`);
    } else {
      console.log('Tip: Set IDENTIFIER_ID to fetch a specific identifier.');
    }

    // 5. Paginated identifier listing for a node
    if (nodeId) {
      console.log(`\nFetching identifiers with pagination for node ${nodeId}...`);
      const paginated = await client.identifiers.listByNodePaginated(nodeId);
      let totalCount = 0;
      for await (const page of paginated) {
        totalCount += page.length;
        page.forEach((id) => {
          console.log(`  - [${id.category}] ${id.value}`);
        });
      }
      console.log(`Total identifiers: ${totalCount}`);
    }
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
