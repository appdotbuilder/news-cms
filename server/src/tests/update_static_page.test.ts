
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type UpdateStaticPageInput, type CreateStaticPageInput } from '../schema';
import { updateStaticPage } from '../handlers/update_static_page';
import { eq } from 'drizzle-orm';

// Helper function to create a test static page
const createTestStaticPage = async (data: CreateStaticPageInput) => {
  const result = await db.insert(staticPagesTable)
    .values({
      title: data.title,
      slug: data.slug,
      content: data.content,
      is_published: data.is_published || false
    })
    .returning()
    .execute();
  return result[0];
};

const testStaticPageInput: CreateStaticPageInput = {
  title: 'Test Static Page',
  slug: 'test-static-page',
  content: 'This is test content for a static page',
  is_published: false
};

describe('updateStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a static page with all fields', async () => {
    // Create test static page first
    const createdPage = await createTestStaticPage(testStaticPageInput);

    const updateInput: UpdateStaticPageInput = {
      id: createdPage.id,
      title: 'Updated Static Page',
      slug: 'updated-static-page',
      content: 'This is updated content',
      is_published: true
    };

    const result = await updateStaticPage(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdPage.id);
    expect(result.title).toEqual('Updated Static Page');
    expect(result.slug).toEqual('updated-static-page');
    expect(result.content).toEqual('This is updated content');
    expect(result.is_published).toEqual(true);
    expect(result.created_at).toEqual(createdPage.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdPage.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create test static page first
    const createdPage = await createTestStaticPage(testStaticPageInput);

    const updateInput: UpdateStaticPageInput = {
      id: createdPage.id,
      title: 'Partially Updated Page',
      is_published: true
    };

    const result = await updateStaticPage(updateInput);

    // Verify only updated fields changed
    expect(result.title).toEqual('Partially Updated Page');
    expect(result.is_published).toEqual(true);
    expect(result.slug).toEqual(createdPage.slug); // Should remain unchanged
    expect(result.content).toEqual(createdPage.content); // Should remain unchanged
    expect(result.updated_at > createdPage.updated_at).toBe(true);
  });

  it('should save updated static page to database', async () => {
    // Create test static page first
    const createdPage = await createTestStaticPage(testStaticPageInput);

    const updateInput: UpdateStaticPageInput = {
      id: createdPage.id,
      title: 'Database Test Page',
      content: 'Updated content for database test'
    };

    const result = await updateStaticPage(updateInput);

    // Verify changes were persisted to database
    const savedPages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, result.id))
      .execute();

    expect(savedPages).toHaveLength(1);
    expect(savedPages[0].title).toEqual('Database Test Page');
    expect(savedPages[0].content).toEqual('Updated content for database test');
    expect(savedPages[0].slug).toEqual(createdPage.slug); // Unchanged field
    expect(savedPages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when static page does not exist', async () => {
    const updateInput: UpdateStaticPageInput = {
      id: 99999, // Non-existent ID
      title: 'This Should Fail'
    };

    expect(updateStaticPage(updateInput)).rejects.toThrow(/static page with id 99999 not found/i);
  });

  it('should update published_at timestamp when publishing', async () => {
    // Create unpublished static page
    const createdPage = await createTestStaticPage(testStaticPageInput);
    expect(createdPage.is_published).toBe(false);

    const updateInput: UpdateStaticPageInput = {
      id: createdPage.id,
      is_published: true
    };

    const result = await updateStaticPage(updateInput);

    expect(result.is_published).toBe(true);
    expect(result.updated_at > createdPage.updated_at).toBe(true);
  });
});
