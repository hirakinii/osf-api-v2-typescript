import { OsfClient } from '../src';

/**
 * Example demonstrating Collection operations:
 * - List collections with filters
 * - Create a new collection
 * - Get a collection by ID
 * - Link and unlink nodes
 * - List linked nodes and registrations
 * - Delete a collection
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/collections.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List existing collections
    console.log('Fetching collections...');
    const collections = await client.collections.listCollections();

    console.log(`Found ${collections.data.length} collections:`);
    collections.data.forEach((col) => {
      console.log(`  - [${col.id}] ${col.title}`);
      console.log(`    Public: ${col.is_public}, Promoted: ${col.is_promoted}`);
      console.log(`    Created: ${col.date_created}`);
    });

    // 2. Create a new collection
    console.log('\nCreating a new collection...');
    const newCol = await client.collections.create({
      title: 'Example Collection',
    });

    console.log('--- Created Collection ---');
    console.log(`ID: ${newCol.id}`);
    console.log(`Title: ${newCol.title}`);

    // 3. Get the collection by ID
    console.log(`\nFetching collection ${newCol.id}...`);
    const detail = await client.collections.getById(newCol.id);
    console.log(`Title: ${detail.title}`);
    console.log(`Bookmarks: ${detail.bookmarks}`);

    // 4. Link a node to the collection (requires an existing node ID)
    // Uncomment the following lines and replace NODE_ID with a real node ID:
    const nodeId = process.env.NODE_ID;
    if (nodeId) {
      console.log(`\nLinking node ${nodeId} to collection ${newCol.id}...`);
      await client.collections.addLinkedNode(newCol.id, nodeId);
      console.log('Node linked successfully.');
    } else {
      console.log("\nSkipped: Linking a node to collection. Set NODE_ID to demonstrate linking.")
    }

    // 5. List linked nodes
    console.log(`\nFetching linked nodes of collection ${newCol.id}...`);
    const linkedNodes = await client.collections.listLinkedNodes(newCol.id);
    console.log(`Found ${linkedNodes.data.length} linked nodes.`);

    // 6. List linked registrations
    console.log(`\nFetching linked registrations of collection ${newCol.id}...`);
    const linkedRegs = await client.collections.listLinkedRegistrations(newCol.id);
    console.log(`Found ${linkedRegs.data.length} linked registrations.`);

    // 7. Unlink a node (requires a linked node)
    // Uncomment:
    // console.log(`\nUnlinking node ${nodeId} from collection ${newCol.id}...`);
    // await client.collections.removeLinkedNode(newCol.id, nodeId);
    // console.log('Node unlinked successfully.');

    // 8. Delete the collection
    console.log(`\nDeleting collection ${newCol.id}...`);
    await client.collections.delete(newCol.id);
    console.log('Collection deleted successfully.');

    // 9. Paginate through collections
    console.log('\n--- Paginated Collection Listing ---');
    const paginated = await client.collections.listCollectionsPaginated();

    let count = 0;
    for await (const col of paginated.items()) {
      console.log(`${++count}. [${col.id}] ${col.title}`);
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
