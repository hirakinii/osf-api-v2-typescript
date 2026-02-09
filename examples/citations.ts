import { OsfClient } from '../src';

/**
 * Example demonstrating Citation Style operations:
 * - List available citation styles
 * - Get a specific citation style by ID
 * - Filter citation styles by title
 * - Paginated citation style listing
 *
 * Citation styles define formatting rules for academic references
 * (e.g., APA, MLA, Chicago). OSF supports hundreds of standard
 * citation styles that can be used to format node/registration citations.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/citations.ts
 */
async function main() {
  const token = process.env.OSF_TOKEN;
  if (!token) {
    console.error('OSF_TOKEN is required');
    process.exit(1);
  }

  const client = new OsfClient({ token });

  try {
    // 1. List available citation styles
    console.log('Fetching citation styles...');
    const styles = await client.citations.listStyles();
    console.log(`Found ${styles.data.length} citation styles:`);
    styles.data.forEach((style, i) => {
      const shortTitle = style.short_title ? ` (${style.short_title})` : '';
      console.log(`  ${i + 1}. ${style.title}${shortTitle}`);
    });

    // 2. Get a specific citation style (e.g., APA)
    const styleId = process.env.CITATION_STYLE_ID || 'apa';
    console.log(`\nFetching citation style "${styleId}"...`);
    const style = await client.citations.getStyle(styleId);
    console.log('--- Citation Style Details ---');
    console.log(`Title: ${style.title}`);
    console.log(`Short title: ${style.short_title}`);
    console.log(`Summary: ${style.summary || '(none)'}`);
    console.log(`Date parsed: ${style.date_parsed}`);

    // 3. Filter citation styles by title
    console.log('\nSearching for citation styles containing "IEEE"...');
    const filtered = await client.citations.listStyles({
      'filter[title]': 'IEEE',
    });
    console.log(`Found ${filtered.data.length} matching styles:`);
    filtered.data.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.title}`);
    });

    // 4. Paginated citation style listing
    console.log('\nFetching citation styles with pagination...');
    const paginated = await client.citations.listStylesPaginated();
    let pageCount = 0;
    let totalCount = 0;
    for await (const page of paginated) {
      pageCount++;
      totalCount += page.length;
      console.log(`  Page ${pageCount}: ${page.length} styles`);
      if (pageCount >= 3) {
        console.log('  (stopping after 3 pages for demo)');
        break;
      }
    }
    console.log(`Total citation styles fetched: ${totalCount}`);
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
