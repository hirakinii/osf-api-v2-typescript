import { OsfClient } from '../src';

/**
 * Example demonstrating License operations:
 * - List all available licenses
 * - Get a specific license by ID
 * - Filter licenses by name
 * - Paginated license listing
 *
 * Licenses define the terms under which OSF content can be shared
 * and reused (e.g., CC-BY 4.0, MIT, No License).
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/licenses.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List all available licenses
    console.log('Fetching available licenses...');
    const licenses = await client.licenses.listLicenses();
    console.log(`Found ${licenses.data.length} licenses:`);
    licenses.data.forEach((license, i) => {
      console.log(`  ${i + 1}. ${license.name}`);
      if (license.required_fields && license.required_fields.length > 0) {
        console.log(`     Required fields: ${license.required_fields.join(', ')}`);
      }
    });

    // 2. Get a specific license by ID
    const licenseId = process.env.LICENSE_ID;
    if (licenseId) {
      console.log(`\nFetching license ${licenseId}...`);
      const license = await client.licenses.getById(licenseId);
      console.log('--- License Details ---');
      console.log(`Name: ${license.name}`);
      console.log(`Required fields: ${license.required_fields?.join(', ') || 'none'}`);
      console.log(`Text (first 300 chars):`);
      console.log(license.text.substring(0, 300));
      if (license.text.length > 300) {
        console.log(`... (${license.text.length} total characters)`);
      }
    } else {
      console.log('\nTip: Set LICENSE_ID to fetch a specific license and view its full text.');
    }

    // 3. Filter licenses by name
    console.log('\nSearching for Creative Commons licenses...');
    const filtered = await client.licenses.listLicenses({
      'filter[name]': 'CC',
    });
    console.log(`Found ${filtered.data.length} matching licenses:`);
    filtered.data.forEach((license, i) => {
      console.log(`  ${i + 1}. ${license.name}`);
    });

    // 4. Paginated license listing
    console.log('\nFetching licenses with pagination...');
    const paginated = await client.licenses.listLicensesPaginated();
    let totalCount = 0;
    for await (const page of paginated) {
      totalCount += page.length;
      page.forEach((license) => {
        console.log(`  - ${license.name}`);
      });
    }
    console.log(`Total licenses: ${totalCount}`);
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
