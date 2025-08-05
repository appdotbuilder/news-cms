
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, articlesTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { createArticle } from '../handlers/create_article';
import { eq } from 'drizzle-orm';

describe('createArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test user
  const createTestUser = async () => {
    const users = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();
    return users[0];
  };

  // Helper to create test category
  const createTestCategory = async () => {
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();
    return categories[0];
  };

  it('should create an article with all fields', async () => {
    const user = await createTestUser();
    const category = await createTestCategory();

    const testInput: CreateArticleInput = {
      title: 'Test Article',
      slug: 'test-article',
      content: 'This is test article content',
      excerpt: 'This is a test excerpt',
      is_published: true,
      author_id: user.id,
      category_id: category.id
    };

    const result = await createArticle(testInput);

    expect(result.title).toEqual('Test Article');
    expect(result.slug).toEqual('test-article');
    expect(result.content).toEqual('This is test article content');
    expect(result.excerpt).toEqual('This is a test excerpt');
    expect(result.is_published).toEqual(true);
    expect(result.author_id).toEqual(user.id);
    expect(result.category_id).toEqual(category.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should create an unpublished article without published_at', async () => {
    const user = await createTestUser();

    const testInput: CreateArticleInput = {
      title: 'Draft Article',
      slug: 'draft-article',
      content: 'This is draft content',
      excerpt: null,
      is_published: false,
      author_id: user.id,
      category_id: null
    };

    const result = await createArticle(testInput);

    expect(result.title).toEqual('Draft Article');
    expect(result.is_published).toEqual(false);
    expect(result.excerpt).toBeNull();
    expect(result.category_id).toBeNull();
    expect(result.published_at).toBeNull();
  });

  it('should save article to database', async () => {
    const user = await createTestUser();

    const testInput: CreateArticleInput = {
      title: 'Database Test',
      slug: 'database-test',
      content: 'Testing database save',
      excerpt: null,
      is_published: false,
      author_id: user.id,
      category_id: null
    };

    const result = await createArticle(testInput);

    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toEqual('Database Test');
    expect(articles[0].slug).toEqual('database-test');
    expect(articles[0].author_id).toEqual(user.id);
    expect(articles[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when author does not exist', async () => {
    const testInput: CreateArticleInput = {
      title: 'Test Article',
      slug: 'test-article',
      content: 'Test content',
      excerpt: null,
      is_published: false,
      author_id: 999, // Non-existent author
      category_id: null
    };

    await expect(createArticle(testInput)).rejects.toThrow(/author not found/i);
  });

  it('should throw error when category does not exist', async () => {
    const user = await createTestUser();

    const testInput: CreateArticleInput = {
      title: 'Test Article',
      slug: 'test-article',
      content: 'Test content',
      excerpt: null,
      is_published: false,
      author_id: user.id,
      category_id: 999 // Non-existent category
    };

    await expect(createArticle(testInput)).rejects.toThrow(/category not found/i);
  });

  it('should set published_at when is_published is true', async () => {
    const user = await createTestUser();

    const testInput: CreateArticleInput = {
      title: 'Published Article',
      slug: 'published-article',
      content: 'Published content',
      excerpt: null,
      is_published: true,
      author_id: user.id,
      category_id: null
    };

    const result = await createArticle(testInput);

    expect(result.is_published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });
});
