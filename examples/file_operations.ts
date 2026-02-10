import { OsfClient } from '../src';

/**
 * Example demonstrating file operations.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/file_operations.ts [nodeId]
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  const nodeId = process.argv[2]; // Get nodeId from command line argument

  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    let targetNodeId = nodeId;

    if (!targetNodeId) {
      console.log('No nodeId provided. Fetching your first project...');
      const currentUser = await client.users.me();
      const myNodes = await client.nodes.listNodes({
        'filter[contributors]': currentUser.id,
        'page[size]': 1,
      });
      if (myNodes.data.length === 0) {
        console.error('No projects found in your account to list files from.');
        return;
      }
      targetNodeId = myNodes.data[0].id;
      console.log(`Using project: ${myNodes.data[0].title} (${targetNodeId})`);
    }

    // 1. List storage providers for the node
    console.log(`\nFetching storage providers for node ${targetNodeId}...`);
    const providers = await client.files.listProviders(targetNodeId);
    console.log('Providers available:', providers.data.map((p) => p.name).join(', '));

    // 2. List files in the first provider (usually osfstorage)
    const providerId = providers.data[0]?.provider || 'osfstorage';
    console.log(`\nListing files in '${providerId}'...`);
    const fileList = await client.files.listByNode(targetNodeId, providerId);

    if (fileList.data.length === 0) {
      console.log('No files found in this storage provider.');
      return;
    }

    console.log(`Found ${fileList.data.length} items:`);
    for (const item of fileList.data) {
      const type = item.kind === 'folder' ? '[DIR]' : '[FILE]';
      console.log(`${type} ${item.name} (ID: ${item.id})`);

      // If it's a file, demonstrate metadata
      if (item.kind === 'file') {
        console.log(`   Size: ${item.size} bytes`);
        console.log(`   Download link available: ${!!client.files.getDownloadUrl(item)}`);
      }
    }

    // 3. Demonstrate download (first file found)
    const firstFile = fileList.data.find((f) => f.kind === 'file');
    if (firstFile) {
      console.log(`\nDemonstrating download for: ${firstFile.name}...`);
      const content = await client.files.download(firstFile);
      console.log(`Successfully downloaded ${content.byteLength} bytes.`);
    }
  } catch (error) {
    console.error('Error fetching files:', error);
  }
}

main();
