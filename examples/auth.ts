import { OsfClient } from '../src';

/**
 * Example demonstrating Authentication & Authorization operations:
 * - OAuth Applications: CRUD operations for OAuth2 app management
 * - Personal Access Tokens: create, list, and manage PATs
 * - Scopes: list available OAuth scopes
 *
 * These APIs allow developers to manage OAuth2 applications,
 * personal access tokens, and explore available permission scopes
 * on the OSF platform.
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * npx ts-node examples/auth.ts
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
    // OAuth Scopes
    // ============================================
    console.log('=== OAuth Scopes ===');

    // 1. List available scopes
    console.log('Fetching available OAuth scopes...');
    const scopes = await client.scopes.listScopes();
    console.log(`Found ${scopes.data.length} scopes:`);
    scopes.data.forEach((scope, i) => {
      console.log(`  ${i + 1}. ${scope.description}`);
    });

    // 2. Get a specific scope
    const scopeId = process.env.SCOPE_ID || 'osf.full_read';
    console.log(`\nFetching scope "${scopeId}"...`);
    const scope = await client.scopes.getById(scopeId);
    console.log('--- Scope Details ---');
    console.log(`Description: ${scope.description}`);

    // ============================================
    // OAuth Applications
    // ============================================
    console.log('\n=== OAuth Applications ===');

    // 3. List registered applications
    console.log('Fetching registered OAuth applications...');
    const apps = await client.applications.listApplications();
    console.log(`Found ${apps.data.length} applications:`);
    apps.data.forEach((app, i) => {
      console.log(`  ${i + 1}. ${app.name}`);
      console.log(`     Home URL: ${app.home_url}`);
      console.log(`     Created: ${app.date_created}`);
    });

    // 4. Create, update, and delete an application (demo flow)
    if (process.env.DEMO_APP_CRUD === 'true') {
      console.log('\n--- Application CRUD Demo ---');

      // Create
      console.log('Creating a new OAuth application...');
      const newApp = await client.applications.create({
        name: 'Example Test App',
        description: 'Created by osf-api-v2-typescript example',
        home_url: 'https://example.com',
        callback_url: 'https://example.com/callback',
      });
      console.log(`Created application: ${newApp.name}`);
      console.log(`  Home URL: ${newApp.home_url}`);
      console.log(`  Callback URL: ${newApp.callback_url}`);

      // Update
      const appId = newApp.id;
      console.log(`\nUpdating application ${appId}...`);
      const updatedApp = await client.applications.update(appId, {
        description: 'Updated description from example',
      });
      console.log(`Updated description: ${updatedApp.description}`);

      // Delete (deactivate)
      console.log(`\nDeactivating application ${appId}...`);
      await client.applications.delete(appId);
      console.log('Application deactivated successfully.');
    } else {
      console.log('\nTip: Set DEMO_APP_CRUD=true to run the create/update/delete demo.');
    }

    // 5. Get a specific application
    const appId = process.env.APP_CLIENT_ID;
    if (appId) {
      console.log(`\nFetching application ${appId}...`);
      const app = await client.applications.getById(appId);
      console.log('--- Application Details ---');
      console.log(`Name: ${app.name}`);
      console.log(`Description: ${app.description}`);
      console.log(`Home URL: ${app.home_url}`);
      console.log(`Callback URL: ${app.callback_url}`);
      console.log(`Owner: ${app.owner}`);
      console.log(`Created: ${app.date_created}`);
    } else {
      console.log('\nTip: Set APP_CLIENT_ID to fetch a specific application.');
    }

    // ============================================
    // Personal Access Tokens
    // ============================================
    console.log('\n=== Personal Access Tokens ===');

    // 6. List personal access tokens
    console.log('Fetching personal access tokens...');
    const tokens = await client.tokens.listTokens();
    console.log(`Found ${tokens.data.length} tokens:`);
    tokens.data.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (created: ${t.date_created})`);
    });

    // 7. Create and delete a token (demo flow)
    if (process.env.DEMO_TOKEN_CRUD === 'true') {
      console.log('\n--- Token CRUD Demo ---');

      // Create
      console.log('Creating a new personal access token...');
      const newToken = await client.tokens.create({
        name: 'Example Token',
        scopes: ['osf.full_read'],
      });
      console.log(`Created token: ${newToken.name}`);
      if (newToken.token_id) {
        console.log(`  Token value (save this!): ${newToken.token_id}`);
        console.log('  WARNING: This token value is only shown once during creation.');
      }

      // List scopes for this token
      const tokenId = newToken.id;
      console.log(`\nFetching scopes for token ${tokenId}...`);
      const tokenScopes = await client.tokens.listScopes(tokenId);
      console.log(`Token has ${tokenScopes.data.length} scopes:`);
      tokenScopes.data.forEach((s) => {
        console.log(`  - ${s.description}`);
      });

      // Delete (deactivate)
      console.log(`\nDeactivating token ${tokenId}...`);
      await client.tokens.delete(tokenId);
      console.log('Token deactivated successfully.');
    } else {
      console.log('\nTip: Set DEMO_TOKEN_CRUD=true to run the create/delete demo.');
    }

    // 8. Get a specific token
    const tokenId = process.env.TOKEN_ID;
    if (tokenId) {
      console.log(`\nFetching token ${tokenId}...`);
      const t = await client.tokens.getById(tokenId);
      console.log('--- Token Details ---');
      console.log(`Name: ${t.name}`);
      console.log(`Created: ${t.date_created}`);

      // List scopes for this token
      console.log(`\nFetching scopes for token ${tokenId}...`);
      const tokenScopes = await client.tokens.listScopes(tokenId);
      console.log(`Token scopes:`);
      tokenScopes.data.forEach((s) => {
        console.log(`  - ${s.description}`);
      });
    } else {
      console.log('\nTip: Set TOKEN_ID to fetch a specific token and its scopes.');
    }
  } catch (error) {
    console.error('Operation failed:', error instanceof Error ? error.message : error);
  }
}

main();
