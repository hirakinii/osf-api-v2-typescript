import { OsfClient } from '../src';

/**
 * Example demonstrating Node (Project) management: Create, Read, Update, Delete.
 *
 * WARNING: This example creates and deletes a node on your account.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/nodes_management.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. Create a new project (Node)
    console.log('Creating a new test project...');
    const newNode = await client.nodes.create({
      title: 'SDK Test Project (Typescript)',
      description: 'A project created using the osf-api-v2-typescript client.',
      category: 'project',
      public: false, // Keep it private
    });

    const nodeId = newNode.id;
    console.log(`Created node with ID: ${nodeId}`);
    console.log(`Title: ${newNode.title}`);

    // 2. Update the project
    console.log(`\nUpdating project ${nodeId}...`);
    const updatedNode = await client.nodes.update(nodeId, {
      title: 'Updated SDK Test Project',
      description: 'This description has been updated via the API.',
    });

    console.log(`New Title: ${updatedNode.title}`);

    // 3. Get the node by ID (verify)
    console.log(`\nRetrieving project ${nodeId} to verify...`);
    const fetchedNode = await client.nodes.getById(nodeId);
    console.log(`Verified title: ${fetchedNode.title}`);

    // 4. Delete the project
    console.log(`\nDeleting project ${nodeId}...`);
    await client.nodes.deleteNode(nodeId);
    console.log('Project deleted successfully.');
  } catch (error) {
    console.error('Operation failed:', error);
  }
}

main();
