import { OsfClient } from '../src';

/**
 * Example demonstrating Provider operations:
 * - List and get preprint providers
 * - List and get registration providers
 * - List and get collection providers
 * - Filter providers by name
 * - Paginated provider listing
 *
 * Providers are organizations or services that host content on OSF.
 * Each provider type corresponds to a different content category:
 * - Preprint providers host preprints (e.g., OSF Preprints, PsyArXiv)
 * - Registration providers host registrations (e.g., OSF Registries)
 * - Collection providers manage curated collections
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/providers.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // ============================================
    // Preprint Providers
    // ============================================
    console.log('=== Preprint Providers ===');

    // 1. List preprint providers
    console.log('Fetching preprint providers...');
    const preprintProviders = await client.preprintProviders.listProviders();
    console.log(`Found ${preprintProviders.data.length} preprint providers:`);
    preprintProviders.data.forEach((provider, i) => {
      console.log(`  ${i + 1}. ${provider.name}`);
      if (provider.description) {
        console.log(`     ${provider.description.substring(0, 80)}...`);
      }
    });

    // 2. Get a specific preprint provider
    const preprintProviderId = process.env.PREPRINT_PROVIDER_ID || 'osf';
    console.log(`\nFetching preprint provider "${preprintProviderId}"...`);
    const preprintProvider = await client.preprintProviders.getById(preprintProviderId);
    console.log('--- Preprint Provider Details ---');
    console.log(`Name: ${preprintProvider.name}`);
    console.log(`Domain: ${preprintProvider.domain}`);
    console.log(`Email support: ${preprintProvider.email_support}`);

    // ============================================
    // Registration Providers
    // ============================================
    console.log('\n=== Registration Providers ===');

    // 3. List registration providers
    console.log('Fetching registration providers...');
    const regProviders = await client.registrationProviders.listProviders();
    console.log(`Found ${regProviders.data.length} registration providers:`);
    regProviders.data.forEach((provider, i) => {
      console.log(`  ${i + 1}. ${provider.name}`);
      if (provider.description) {
        console.log(`     ${provider.description.substring(0, 80)}...`);
      }
    });

    // 4. Get a specific registration provider
    const regProviderId = process.env.REGISTRATION_PROVIDER_ID || 'osf';
    console.log(`\nFetching registration provider "${regProviderId}"...`);
    const regProvider = await client.registrationProviders.getById(regProviderId);
    console.log('--- Registration Provider Details ---');
    console.log(`Name: ${regProvider.name}`);
    console.log(`Domain: ${regProvider.domain}`);
    console.log(`Email support: ${regProvider.email_support}`);

    // ============================================
    // Collection Providers
    // ============================================
    console.log('\n=== Collection Providers ===');

    // 5. List collection providers
    console.log('Fetching collection providers...');
    const collectionProviders = await client.collectionProviders.listProviders();
    console.log(`Found ${collectionProviders.data.length} collection providers:`);
    collectionProviders.data.forEach((provider, i) => {
      console.log(`  ${i + 1}. ${provider.name}`);
      if (provider.description) {
        console.log(`     ${provider.description.substring(0, 80)}...`);
      }
    });

    // 6. Get a specific collection provider
    const collProviderId = process.env.COLLECTION_PROVIDER_ID;
    if (collProviderId) {
      console.log(`\nFetching collection provider "${collProviderId}"...`);
      const collProvider = await client.collectionProviders.getById(collProviderId);
      console.log('--- Collection Provider Details ---');
      console.log(`Name: ${collProvider.name}`);
      console.log(`Domain: ${collProvider.domain}`);
      console.log(`Allow submissions: ${collProvider.allow_submissions}`);
      console.log(`Allow commenting: ${collProvider.allow_commenting}`);
      console.log(`Reviews workflow: ${collProvider.reviews_workflow}`);
    } else {
      console.log('\nTip: Set COLLECTION_PROVIDER_ID to fetch a specific collection provider.');
    }

    // ============================================
    // Filter and Pagination
    // ============================================

    // 7. Filter preprint providers by name
    console.log('\n=== Filtering & Pagination ===');
    console.log('Searching for preprint providers containing "arXiv"...');
    const filtered = await client.preprintProviders.listProviders({
      'filter[name]': 'arXiv',
    });
    console.log(`Found ${filtered.data.length} matching providers:`);
    filtered.data.forEach((p) => {
      console.log(`  - ${p.name}`);
    });

    // 8. Paginated preprint provider listing
    console.log('\nFetching preprint providers with pagination...');
    const paginated = await client.preprintProviders.listProvidersPaginated();
    let totalCount = 0;
    for await (const page of paginated) {
      totalCount += page.length;
      page.forEach((p) => {
        console.log(`  - ${p.name}`);
      });
    }
    console.log(`Total preprint providers: ${totalCount}`);
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
