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

    // 4. Demonstrate uploading a new file
    // console.log('\nDemonstrating file upload...');
    // const rootFolder = providers.data.find((p) => p.provider === 'osfstorage');
    // if (rootFolder) {
    //   const testContent = new TextEncoder().encode('This is a test file created by the SDK example.');
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //   const testFileName = `test-upload-${timestamp}.txt`;

    //   console.log(`Uploading new file: ${testFileName}...`);
    //   const uploadedFile = await client.files.uploadNew(rootFolder, testFileName, testContent);
    //   console.log(`Successfully uploaded file: ${uploadedFile.name} (ID: ${uploadedFile.id})`);

    //   // 5. Demonstrate updating the uploaded file
    //   console.log(`\nUpdating the uploaded file...`);
    //   const updatedContent = new TextEncoder().encode('This file has been updated!');
    //   const updatedFile = await client.files.upload(uploadedFile, updatedContent);
    //   console.log(`Successfully updated file. New size: ${updatedFile.size} bytes`);

    //   // 6. Clean up: delete the test file
    //   console.log(`\nCleaning up: deleting test file...`);
    //   await client.files.deleteFile(updatedFile);
    //   console.log('Test file deleted successfully.');
    // }
  } catch (error) {
    console.error('Error in file operations:', error);
  }
}

main();
