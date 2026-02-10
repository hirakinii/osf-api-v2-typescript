import { OsfClient } from '../src';

/**
 * Example demonstrating Comment operations:
 * - List comments on a node
 * - Create a new comment
 * - Get a comment by ID
 * - Update a comment
 * - Reply to a comment
 * - Delete a comment
 * - Paginate through comments
 *
 * To run:
 * export OSF_TOKEN='your-token'
 * export NODE_ID='your-node-id'
 * npx ts-node examples/comments.ts
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
    // 1. List existing comments on a node
    console.log(`Fetching comments for node ${nodeId}...`);
    const comments = await client.comments.listByNode(nodeId);

    console.log(`Found ${comments.data.length} comments:`);
    comments.data.forEach((comment) => {
      console.log(`  - [${comment.id}] ${comment.content?.substring(0, 80) || '(empty)'}...`);
      console.log(`    Created: ${comment.date_created}`);
      console.log(`    Deleted: ${comment.deleted}`);
    });

    // 2. Create a new comment on the node
    console.log('\nCreating a new comment...');
    const newComment = await client.comments.create(nodeId, {
      content: 'This is a comment created via the OSF API v2 TypeScript client.',
    });

    console.log('--- Created Comment ---');
    console.log(`ID: ${newComment.id}`);
    console.log(`Content: ${newComment.content}`);
    console.log(`Created: ${newComment.date_created}`);

    // 3. Get a comment by ID
    console.log(`\nFetching comment ${newComment.id}...`);
    const detail = await client.comments.getById(newComment.id);
    console.log(`Content: ${detail.content}`);
    console.log(`Can Edit: ${detail.can_edit}`);
    console.log(`Has Children: ${detail.has_children}`);

    // 4. Update the comment
    console.log(`\nUpdating comment ${newComment.id}...`);
    const updated = await client.comments.update(newComment.id, {
      content: 'This comment was updated via the API client.',
      target_id: nodeId,
    });
    console.log(`Updated content: ${updated.content}`);

    // 5. Reply to the comment
    console.log(`\nReplying to comment ${newComment.id}...`);
    const reply = await client.comments.create(nodeId, {
      content: 'This is a reply to the above comment.',
      target_id: newComment.id,
      target_type: 'comments',
    });
    console.log(`Reply ID: ${reply.id}`);
    console.log(`Reply content: ${reply.content}`);

    // 6. Delete the reply and the original comment
    console.log(`\nDeleting reply ${reply.id}...`);
    await client.comments.delete(reply.id);
    console.log('Reply deleted.');

    console.log(`Deleting comment ${newComment.id}...`);
    await client.comments.delete(newComment.id);
    console.log('Comment deleted.');

    // 7. Paginate through comments
    console.log('\n--- Paginated Comment Listing ---');
    const paginated = await client.comments.listByNodePaginated(nodeId);

    let count = 0;
    for await (const comment of paginated.items()) {
      console.log(`${++count}. [${comment.id}] ${comment.content?.substring(0, 60) || '(empty)'}`);
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
