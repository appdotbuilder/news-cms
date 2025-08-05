
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, articlesTable } from '../db/schema';
import { type UpdateArticleInput } from '../schema';
import { updateArticle } from '../handlers/update_article';
import { eq } from 'drizzle-orm';

describe('updateArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCategoryId: number;
  let testArticleId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpass',
        role: 'contributor'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Original Title',
        slug: 'original-slug',
        content: 'Original content',
        excerpt: 'Original excerpt',
        is_published: false,
        author_id: testUserId,
        category_id: testCategoryId
      })
      .returning()
      .execute();
    testArticleId = articleResult[0].id;
  });

  it('should update article title', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'Updated Title'
    };

    const result = await updateArticle(input);

    expect(result.title).toEqual('Updated Title');
    expect(result.slug).toEqual('original-slug'); // Should remain unchanged
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'New Title',
      slug: 'new-slug',
      content: 'New content',
      excerpt: 'New excerpt'
    };

    const result = await updateArticle(input);

    expect(result.title).toEqual('New Title');
    expect(result.slug).toEqual('new-slug');
    expect(result.content).toEqual('New content');
    expect(result.excerpt).toEqual('New excerpt');
    expect(result.author_id).toEqual(testUserId); // Should preserve
    expect(result.category_id).toEqual(testCategoryId); // Should preserve
  });

  it('should set published_at when publishing article for first time', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      is_published: true
    };

    const result = await updateArticle(input);

    expect(result.is_published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should not change published_at if already published', async () => {
    // First publish the article
    await updateArticle({
      id: testArticleId,
      is_published: true
    });

    // Get the published_at timestamp
    const publishedArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, testArticleId))
      .execute();
    const originalPublishedAt = publishedArticle[0].published_at;

    // Update something else while keeping it published
    const result = await updateArticle({
      id: testArticleId,
      title: 'Updated Title',
      is_published: true
    });

    expect(result.published_at).toEqual(originalPublishedAt);
  });

  it('should update category_id', async () => {
    // Create another category
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        slug: 'new-category',
        description: 'Another test category'
      })
      .returning()
      .execute();

    const input: UpdateArticleInput = {
      id: testArticleId,
      category_id: newCategoryResult[0].id
    };

    const result = await updateArticle(input);

    expect(result.category_id).toEqual(newCategoryResult[0].id);
  });

  it('should allow setting category_id to null', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      category_id: null
    };

    const result = await updateArticle(input);

    expect(result.category_id).toBeNull();
  });

  it('should save changes to database', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'Database Updated Title',
      is_published: true
    };

    await updateArticle(input);

    // Verify changes persisted
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, testArticleId))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toEqual('Database Updated Title');
    expect(articles[0].is_published).toBe(true);
    expect(articles[0].published_at).toBeInstanceOf(Date);
  });

  it('should throw error when article does not exist', async () => {
    const input: UpdateArticleInput = {
      id: 99999,
      title: 'Non-existent Article'
    };

    expect(() => updateArticle(input)).toThrow(/Article not found/i);
  });
});
