import { OsfClient } from '../src';

/**
 * Example demonstrating Subject (taxonomy) operations:
 * - List top-level subjects
 * - Get a specific subject by ID
 * - List child subjects (subcategories)
 * - Filter subjects by text
 * - Paginated subject listing
 *
 * Subjects represent the taxonomy/classification system used by OSF
 * to categorize research (e.g., "Social and Behavioral Sciences" >
 * "Psychology" > "Cognitive Psychology").
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/subjects.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List top-level subjects
    console.log('Fetching top-level subjects...');
    const subjects = await client.subjects.listSubjects();
    console.log(`Found ${subjects.data.length} subjects:`);
    subjects.data.forEach((subject, i) => {
      console.log(`  ${i + 1}. ${subject.text} (taxonomy: ${subject.taxonomy_name})`);
    });

    // 2. Get a specific subject by ID
    const subjectId = process.env.SUBJECT_ID;
    if (subjectId) {
      console.log(`\nFetching subject ${subjectId}...`);
      const subject = await client.subjects.getById(subjectId);
      console.log('--- Subject Details ---');
      console.log(`Text: ${subject.text}`);
      console.log(`Taxonomy: ${subject.taxonomy_name}`);

      // 3. List child subjects (subcategories)
      console.log(`\nFetching children of "${subject.text}"...`);
      const children = await client.subjects.listChildren(subjectId);
      if (children.data.length > 0) {
        console.log(`Found ${children.data.length} child subjects:`);
        children.data.forEach((child, i) => {
          console.log(`  ${i + 1}. ${child.text}`);
        });
      } else {
        console.log('No child subjects found (this is a leaf subject).');
      }
    } else {
      console.log('\nTip: Set SUBJECT_ID to fetch a specific subject and its children.');
    }

    // 4. Filter subjects by text
    console.log('\nSearching for subjects containing "Psychology"...');
    const filtered = await client.subjects.listSubjects({
      'filter[text]': 'Psychology',
    });
    console.log(`Found ${filtered.data.length} matching subjects:`);
    filtered.data.forEach((subject, i) => {
      console.log(`  ${i + 1}. ${subject.text} (${subject.taxonomy_name})`);
    });

    // 5. Paginated subject listing
    console.log('\nFetching subjects with pagination...');
    const paginated = await client.subjects.listSubjectsPaginated();
    let pageCount = 0;
    let totalCount = 0;
    for await (const page of paginated) {
      pageCount++;
      totalCount += page.length;
      console.log(`  Page ${pageCount}: ${page.length} subjects`);
      if (pageCount >= 3) {
        console.log('  (stopping after 3 pages for demo)');
        break;
      }
    }
    console.log(`Total subjects fetched: ${totalCount}`);
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
