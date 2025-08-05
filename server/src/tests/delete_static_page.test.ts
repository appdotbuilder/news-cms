
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteStaticPage } from '../handlers/delete_static_page';
import { eq } from 'drizzle-orm';

describe('deleteStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing static page', async () => {
    // Create a test static page
    const createResult = await db.insert(staticPagesTable)
      .values({
        title: 'Test Page',
        slug: 'test-page',
        content: 'Test content',
        is_published: true
      })
      .returning()
      .execute();

    const staticPageId = createResult[0].id;

    // Delete the static page
    const input: DeleteInput = { id: staticPageId };
    const result = await deleteStaticPage(input);

    expect(result.success).toBe(true);

    // Verify the static page was deleted from the database
    const staticPages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, staticPageId))
      .execute();

    expect(staticPages).toHaveLength(0);
  });

  it('should return false when static page does not exist', async () => {
    const input: DeleteInput = { id: 999 };
    const result = await deleteStaticPage(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other static pages when deleting one', async () => {
    // Create two test static pages
    const createResults = await db.insert(staticPagesTable)
      .values([
        {
          title: 'First Page',
          slug: 'first-page',
          content: 'First content',
          is_published: true
        },
        {
          title: 'Second Page',
          slug: 'second-page',
          content: 'Second content',
          is_published: false
        }
      ])
      .returning()
      .execute();

    const firstPageId = createResults[0].id;
    const secondPageId = createResults[1].id;

    // Delete the first static page
    const input: DeleteInput = { id: firstPageId };
    const result = await deleteStaticPage(input);

    expect(result.success).toBe(true);

    // Verify only the first static page was deleted
    const firstPage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, firstPageId))
      .execute();

    const secondPage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, secondPageId))
      .execute();

    expect(firstPage).toHaveLength(0);
    expect(secondPage).toHaveLength(1);
    expect(secondPage[0].title).toBe('Second Page');
  });
});
