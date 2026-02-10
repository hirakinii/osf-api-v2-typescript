import { OsfClient } from '../src';

/**
 * Example demonstrating Draft Registration operations:
 * - List draft registrations with filters
 * - Create a new draft registration
 * - Update a draft registration
 * - List contributors
 * - Delete a draft registration
 * - Paginate through draft registrations
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/draft_registrations.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List existing draft registrations
    console.log('Fetching your draft registrations...');
    const drafts = await client.draftRegistrations.listDraftRegistrations();

    console.log(`Found ${drafts.data.length} draft registrations:`);
    drafts.data.forEach((draft) => {
      console.log(`  - [${draft.id}] ${draft.title || '(untitled)'}`);
      console.log(`    Category: ${draft.category || '(none)'}`);
      console.log(`    Created: ${draft.datetime_initiated}`);
    });

    // 2. Create a new draft registration
    console.log('\nCreating a new draft registration...');
    // NOTE: You need a valid registration_schema_id to create a draft registration.
    // You can get available schemas from: https://api.osf.io/v2/schemas/registrations/
    // Common schema IDs:
    // - '5f4f2a3c9ad8a1001c87c2e4' (Open-Ended Registration)
    // - '61e02b6c90de34000ae3447a' (OSF Preregistration)
    // Replace with a valid schema ID for your use case.
    const newDraft = await client.draftRegistrations.create({
      registration_schema_id: '5f4f2a3c9ad8a1001c87c2e4', // Open-Ended Registration
      title: 'Example Draft Registration',
      description: 'Created via the OSF API v2 TypeScript client example.',
      category: 'project',
      tags: ['example', 'api-demo'],
    });

    console.log('--- Created Draft ---');
    console.log(`ID: ${newDraft.id}`);
    console.log(`Title: ${newDraft.title}`);
    console.log(`Description: ${newDraft.description}`);

    // 3. Update the draft registration
    console.log(`\nUpdating draft ${newDraft.id}...`);
    const updated = await client.draftRegistrations.update(newDraft.id, {
      title: 'Updated Draft Registration Title',
      description: 'This description was updated via the API client.',
    });

    console.log(`Updated title: ${updated.title}`);
    console.log(`Updated description: ${updated.description}`);

    // 4. List contributors
    console.log(`\nFetching contributors of draft ${newDraft.id}...`);
    const contributors = await client.draftRegistrations.listContributors(newDraft.id);
    console.log(`Found ${contributors.data.length} contributors.`);

    // 5. Delete the draft registration
    console.log(`\nDeleting draft ${newDraft.id}...`);
    await client.draftRegistrations.delete(newDraft.id);
    console.log('Draft registration deleted successfully.');

    // 6. Paginate through draft registrations
    console.log('\n--- Paginated Draft Registration Listing ---');
    const paginated = await client.draftRegistrations.listDraftRegistrationsPaginated();

    let count = 0;
    for await (const draft of paginated.items()) {
      console.log(`${++count}. [${draft.id}] ${draft.title || '(untitled)'}`);
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
