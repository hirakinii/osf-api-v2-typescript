import { OsfClient } from '../src';

/**
 * Example demonstrating Contributor operations:
 * - List contributors on a node
 * - Get a specific contributor
 * - Add a contributor to a node
 * - Update contributor permissions
 * - Remove a contributor from a node
 * - List contributors on a registration
 * - Paginate through contributors
 *
 * WARNING: This example modifies contributors on an existing node.
 * Make sure to set NODE_ID and TARGET_USER_ID to valid values.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * export NODE_ID='your-node-id'
 * export TARGET_USER_ID='user-id-to-add'
 * npx ts-node examples/contributors.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List contributors on a public node
    //    Use a known node ID or set NODE_ID env var
    const nodeId = process.env.NODE_ID;
    if (!nodeId) {
      // If no node ID provided, list nodes first and use the first one
      console.log('NODE_ID not set. Fetching your nodes to find one...');
      const nodes = await client.nodes.listNodes({ 'filter[public]': true });

      if (nodes.data.length === 0) {
        console.log('No public nodes found. Please set NODE_ID.');
        return;
      }

      const sampleNodeId = nodes.data[0].id;
      console.log(`Using node: [${sampleNodeId}] ${nodes.data[0].title}\n`);
      await listContributorsDemo(client, sampleNodeId);
      return;
    }

    await listContributorsDemo(client, nodeId);

    // 2. Add, update, and remove a contributor (requires TARGET_USER_ID)
    const targetUserId = process.env.TARGET_USER_ID;
    if (targetUserId) {
      await manageContributorDemo(client, nodeId, targetUserId);
    } else {
      console.log('\nSkipping add/update/remove demo (TARGET_USER_ID not set).');
    }
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Demonstrate listing and getting contributors
 */
async function listContributorsDemo(client: OsfClient, nodeId: string) {
  // List all contributors on a node
  console.log(`Fetching contributors for node ${nodeId}...`);
  const contributors = await client.contributors.listByNode(nodeId);

  console.log(`Found ${contributors.data.length} contributors:`);
  contributors.data.forEach((contrib) => {
    console.log(
      `  - [${contrib.id}] permission: ${contrib.permission}, ` +
        `bibliographic: ${contrib.bibliographic}, index: ${contrib.index}`,
    );
  });

  // Get a specific contributor
  if (contributors.data.length > 0) {
    const firstContrib = contributors.data[0];
    const userId = firstContrib.id.split('-').pop()!;
    console.log(`\nFetching contributor detail for user ${userId}...`);
    const detail = await client.contributors.getByNodeAndUser(nodeId, userId);
    console.log('--- Contributor Detail ---');
    console.log(`Permission: ${detail.permission}`);
    console.log(`Bibliographic: ${detail.bibliographic}`);
    console.log(`Index: ${detail.index}`);
  }

  // Filter bibliographic contributors
  console.log('\nFetching only bibliographic contributors...');
  const bibContribs = await client.contributors.listByNode(nodeId, {
    'filter[bibliographic]': true,
  });
  console.log(`Found ${bibContribs.data.length} bibliographic contributors.`);

  // Paginate through contributors
  console.log('\n--- Paginated Contributor Listing ---');
  const paginated = await client.contributors.listByNodePaginated(nodeId);

  let count = 0;
  for await (const contrib of paginated.items()) {
    console.log(`${++count}. [${contrib.id}] permission: ${contrib.permission}`);
    if (count >= 20) {
      console.log('... reached demo limit of 20 items.');
      break;
    }
  }
}

/**
 * Demonstrate adding, updating, and removing a contributor
 */
async function manageContributorDemo(client: OsfClient, nodeId: string, targetUserId: string) {
  // Add a contributor with read permission
  console.log(`\nAdding user ${targetUserId} as a read-only contributor...`);
  const added = await client.contributors.addToNode(nodeId, {
    userId: targetUserId,
    permission: 'read',
    bibliographic: true,
  });
  console.log(`Added contributor: permission=${added.permission}, bibliographic=${added.bibliographic}`);

  // Update to write permission
  console.log(`\nUpdating contributor ${targetUserId} to write permission...`);
  const updated = await client.contributors.update(nodeId, targetUserId, {
    permission: 'write',
  });
  console.log(`Updated contributor: permission=${updated.permission}`);

  // Remove the contributor
  console.log(`\nRemoving contributor ${targetUserId}...`);
  await client.contributors.removeFromNode(nodeId, targetUserId);
  console.log('Contributor removed successfully.');
}

main();
