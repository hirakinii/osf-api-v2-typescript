import { OsfClient } from '../src';

/**
 * Example demonstrating Log operations:
 * - List logs for a node
 * - Get a specific log by ID
 * - List available log actions
 * - Paginated log listing
 *
 * Logs provide an audit trail of activities on OSF nodes.
 * Each log records an action (e.g., file_added, contributor_added)
 * along with associated parameters and timestamp.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * export NODE_ID='your-node-id'
 * npx ts-node examples/logs.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const nodeId = process.env.NODE_ID;
  if (!nodeId) {
    console.error('NODE_ID is required. Set it via: export NODE_ID="your-node-id"');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List recent logs for a node
    console.log(`Fetching logs for node ${nodeId}...`);
    const logs = await client.logs.listByNode(nodeId);
    console.log(`Found ${logs.data.length} logs:`);
    logs.data.forEach((log, i) => {
      console.log(`  ${i + 1}. [${log.action}] at ${log.date}`);
      if (log.params) {
        const paramKeys = Object.keys(log.params).filter((k) => log.params[k as keyof typeof log.params] !== undefined);
        if (paramKeys.length > 0) {
          console.log(`     Params: ${paramKeys.join(', ')}`);
        }
      }
    });

    // 2. Get a specific log by ID (using the first log from the list)
    if (logs.data.length > 0) {
      const logId = process.env.LOG_ID || (logs as unknown as { meta?: { ids?: string[] } }).meta?.ids?.[0];
      if (logId) {
        console.log(`\nFetching log ${logId}...`);
        const log = await client.logs.getById(logId);
        console.log('--- Log Details ---');
        console.log(`Action: ${log.action}`);
        console.log(`Date: ${log.date}`);
        console.log(`Params: ${JSON.stringify(log.params, null, 2)}`);
      }
    }

    // 3. List available log actions
    console.log('\nFetching available log actions...');
    const actions = await client.logs.listActions();
    console.log(`Found ${actions.data.length} available actions`);

    // 4. Filter logs by action type
    console.log('\nFetching file-related logs...');
    const fileLogs = await client.logs.listByNode(nodeId, {
      'filter[action]': 'file_added',
    });
    console.log(`Found ${fileLogs.data.length} file_added logs`);

    // 5. Paginated log listing
    console.log('\nFetching logs with pagination...');
    const paginated = await client.logs.listByNodePaginated(nodeId);
    let pageCount = 0;
    let totalCount = 0;
    for await (const page of paginated) {
      pageCount++;
      totalCount += page.length;
      console.log(`  Page ${pageCount}: ${page.length} logs`);
      if (pageCount >= 3) {
        console.log('  (stopping after 3 pages for demo)');
        break;
      }
    }
    console.log(`Total logs fetched: ${totalCount}`);
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
