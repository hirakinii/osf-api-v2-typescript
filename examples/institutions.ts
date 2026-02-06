import { OsfClient } from '../src';

/**
 * Example demonstrating Institution operations:
 * - List all institutions
 * - Get a specific institution by ID
 * - List users, nodes, and registrations affiliated with an institution
 * - Paginate through institutions
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/institutions.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List all institutions
    console.log('Fetching institutions...');
    const institutions = await client.institutions.listInstitutions();

    console.log(`Found ${institutions.data.length} institutions:`);
    institutions.data.forEach((inst) => {
      console.log(`  - [${inst.id}] ${inst.name}`);
    });

    if (institutions.data.length === 0) {
      console.log('No institutions found. Exiting.');
      return;
    }

    // 2. Get a specific institution by ID
    const firstInst = institutions.data[0];
    console.log(`\nFetching institution '${firstInst.id}' details...`);
    const detail = await client.institutions.getById(firstInst.id);
    console.log('--- Institution Detail ---');
    console.log(`Name: ${detail.name}`);
    console.log(`Description: ${detail.description || '(none)'}`);
    if (detail.assets?.logo) {
      console.log(`Logo: ${detail.assets.logo}`);
    }

    // 3. List users affiliated with the institution
    console.log(`\nFetching users affiliated with '${firstInst.id}'...`);
    const users = await client.institutions.listUsers(firstInst.id);
    console.log(`Found ${users.data.length} affiliated users.`);

    // 4. List nodes affiliated with the institution
    console.log(`\nFetching nodes affiliated with '${firstInst.id}'...`);
    const nodes = await client.institutions.listNodes(firstInst.id);
    console.log(`Found ${nodes.data.length} affiliated nodes.`);

    // 5. List registrations affiliated with the institution
    console.log(`\nFetching registrations affiliated with '${firstInst.id}'...`);
    const registrations = await client.institutions.listRegistrations(firstInst.id);
    console.log(`Found ${registrations.data.length} affiliated registrations.`);

    // 6. Filter institutions by name
    console.log('\nSearching for institutions with a name filter...');
    const filtered = await client.institutions.listInstitutions({
      'filter[name]': firstInst.name,
    });
    console.log(`Found ${filtered.data.length} institutions matching '${firstInst.name}'.`);

    // 7. Paginate through all institutions
    console.log('\n--- Paginated Institution Listing ---');
    const paginated = await client.institutions.listInstitutionsPaginated();

    let count = 0;
    for await (const inst of paginated.items()) {
      console.log(`${++count}. [${inst.id}] ${inst.name}`);
      if (count >= 15) {
        console.log('... reached demo limit of 15 items.');
        break;
      }
    }
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
