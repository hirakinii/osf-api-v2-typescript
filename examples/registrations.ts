import { OsfClient } from '../src';

/**
 * Example demonstrating Registration operations:
 * - List public registrations with filters
 * - Get a specific registration by ID
 * - List child registrations, contributors, files, wikis, and logs
 * - Paginate through registrations
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/registrations.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List public registrations
    console.log('Fetching public registrations...');
    const registrations = await client.registrations.listRegistrations({
      'filter[public]': true,
    });

    console.log(`Found ${registrations.data.length} registrations:`);
    registrations.data.forEach((reg) => {
      console.log(`  - [${reg.id}] ${reg.title} (category: ${reg.category})`);
    });

    if (registrations.data.length === 0) {
      console.log('No registrations found. Exiting.');
      return;
    }

    // 2. Get a single registration by ID
    const firstReg = registrations.data[0];
    console.log(`\nFetching registration ${firstReg.id} details...`);
    const detail = await client.registrations.getById(firstReg.id);
    console.log('--- Registration Detail ---');
    console.log(`Title: ${detail.title}`);
    console.log(`Description: ${detail.description?.substring(0, 100) || '(none)'}...`);
    console.log(`Date Registered: ${detail.date_registered}`);
    console.log(`Public: ${detail.public}`);
    console.log(`Withdrawn: ${detail.withdrawn}`);
    console.log(`Tags: ${detail.tags?.join(', ') || '(none)'}`);

    // 3. List child registrations (components)
    console.log(`\nFetching child registrations of ${firstReg.id}...`);
    const children = await client.registrations.listChildren(firstReg.id);
    console.log(`Found ${children.data.length} child registrations.`);
    children.data.forEach((child) => {
      console.log(`  - [${child.id}] ${child.title}`);
    });

    // 4. List contributors of the registration
    console.log(`\nFetching contributors of ${firstReg.id}...`);
    const contributors = await client.registrations.listContributors(firstReg.id);
    console.log(`Found ${contributors.data.length} contributors.`);

    // 5. List files of the registration
    console.log(`\nFetching files of ${firstReg.id}...`);
    const files = await client.registrations.listFiles(firstReg.id);
    console.log(`Found ${files.data.length} files.`);

    // 6. Paginate through registrations
    console.log('\n--- Paginated Registration Listing ---');
    const paginated = await client.registrations.listRegistrationsPaginated({
      'filter[public]': true,
    });

    let count = 0;
    for await (const reg of paginated.items()) {
      console.log(`${++count}. [${reg.id}] ${reg.title}`);
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
