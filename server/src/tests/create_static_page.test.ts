
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type CreateStaticPageInput } from '../schema';
import { createStaticPage } from '../handlers/create_static_page';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateStaticPageInput = {
  title: 'Test Static Page',
  slug: 'test-static-page',
  content: 'This is test content for the static page',
  is_published: false
};

describe('createStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a static page', async () => {
    const result = await createStaticPage(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Static Page');
    expect(result.slug).toEqual('test-static-page');
    expect(result.content).toEqual('This is test content for the static page');
    expect(result.is_published).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save static page to database', async () => {
    const result = await createStaticPage(testInput);

    // Query using proper drizzle syntax
    const staticPages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, result.id))
      .execute();

    expect(staticPages).toHaveLength(1);
    expect(staticPages[0].title).toEqual('Test Static Page');
    expect(staticPages[0].slug).toEqual('test-static-page');
    expect(staticPages[0].content).toEqual('This is test content for the static page');
    expect(staticPages[0].is_published).toEqual(false);
    expect(staticPages[0].created_at).toBeInstanceOf(Date);
    expect(staticPages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create published static page', async () => {
    const publishedInput: CreateStaticPageInput = {
      title: 'Published Page',
      slug: 'published-page',
      content: 'This page is published',
      is_published: true
    };

    const result = await createStaticPage(publishedInput);

    expect(result.is_published).toEqual(true);
    expect(result.title).toEqual('Published Page');
    expect(result.slug).toEqual('published-page');
  });

  it('should apply default is_published value', async () => {
    const inputWithoutPublished = {
      title: 'Default Published Page',
      slug: 'default-published-page',
      content: 'This page uses default published value'
    };

    // Type assertion since we're testing Zod defaults
    const result = await createStaticPage(inputWithoutPublished as CreateStaticPageInput);

    expect(result.is_published).toEqual(false); // Default value from schema
  });

  it('should handle duplicate slug error', async () => {
    // Create first static page
    await createStaticPage(testInput);

    // Attempt to create second static page with same slug
    await expect(createStaticPage(testInput)).rejects.toThrow(/duplicate key/i);
  });
});
