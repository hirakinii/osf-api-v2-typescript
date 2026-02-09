import { OsfClient } from '../src';

/**
 * Example demonstrating View Only Link operations:
 * - Get a view only link by ID
 * - List nodes accessible via a view only link
 *
 * View Only Links allow anonymous, read-only access to private
 * nodes/projects without requiring authentication. Admins can
 * create them to share content with reviewers or collaborators
 * who don't have OSF accounts.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * export VOL_ID='your-view-only-link-id'
 * npx ts-node examples/view_only_links.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  const volId = process.env.VOL_ID;
  if (!volId) {
    console.error('VOL_ID is required. Set it to a view only link ID you have admin access to.');
    process.exit(1);
  }

  try {
    // 1. Get a view only link by ID
    console.log(`Fetching view only link ${volId}...`);
    const vol = await client.viewOnlyLinks.getById(volId);
    console.log('--- View Only Link Details ---');
    console.log(`Name: ${vol.name}`);
    console.log(`Key: ${vol.key}`);
    console.log(`Anonymous: ${vol.anonymous}`);
    console.log(`Created: ${vol.date_created}`);

    // 2. List nodes accessible via this link
    console.log(`\nFetching nodes accessible via this link...`);
    const nodes = await client.viewOnlyLinks.listNodes(volId);
    console.log(`Found ${nodes.data.length} accessible nodes:`);
    nodes.data.forEach((node, i) => {
      console.log(`  ${i + 1}. ${node.title} (category: ${node.category})`);
    });
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
