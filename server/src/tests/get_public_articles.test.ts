
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, articlesTable } from '../db/schema';
import { type CreateUserInput, type CreateCategoryInput, type CreateArticleInput } from '../schema';
import { getPublicArticles } from '../handlers/get_public_articles';

// Test data
const testUser: CreateUserInput = {
  username: 'testauthor',
  email: 'author@test.com',
  password: 'password123',
  role: 'contributor'
};

const testCategory: CreateCategoryInput = {
  name: 'Technology',
  slug: 'technology',
  description: 'Tech articles'
};

const publishedArticleInput: CreateArticleInput = {
  title: 'Published Article',
  slug: 'published-article',
  content: 'This is a published article content',
  excerpt: 'Published article excerpt',
  is_published: true,
  category_id: 1,
  author_id: 1
};

const unpublishedArticleInput: CreateArticleInput = {
  title: 'Draft Article',
  slug: 'draft-article',
  content: 'This is a draft article content',
  excerpt: 'Draft article excerpt',
  is_published: false,
  category_id: 1,
  author_id: 1
};

const publishedWithoutCategoryInput: CreateArticleInput = {
  title: 'No Category Article',
  slug: 'no-category-article',
  content: 'Article without category',
  excerpt: 'No category excerpt',
  is_published: true,
  category_id: null,
  author_id: 1
};

describe('getPublicArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only published articles', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        slug: testCategory.slug,
        description: testCategory.description
      })
      .returning()
      .execute();

    // Create both published and unpublished articles
    await db.insert(articlesTable)
      .values([
        {
          ...publishedArticleInput,
          author_id: userResult[0].id,
          category_id: categoryResult[0].id
        },
        {
          ...unpublishedArticleInput,
          author_id: userResult[0].id,
          category_id: categoryResult[0].id
        }
      ])
      .execute();

    const result = await getPublicArticles();

    // Should only return published articles
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published Article');
    expect(result[0].is_published).toBe(true);
    expect(result[0].author_id).toEqual(userResult[0].id);
    expect(result[0].category_id).toEqual(categoryResult[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return articles without categories', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    // Create published article without category
    await db.insert(articlesTable)
      .values({
        ...publishedWithoutCategoryInput,
        author_id: userResult[0].id,
        category_id: null
      })
      .execute();

    const result = await getPublicArticles();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('No Category Article');
    expect(result[0].is_published).toBe(true);
    expect(result[0].category_id).toBeNull();
    expect(result[0].author_id).toEqual(userResult[0].id);
  });

  it('should return empty array when no published articles exist', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        slug: testCategory.slug,
        description: testCategory.description
      })
      .returning()
      .execute();

    // Create only unpublished article
    await db.insert(articlesTable)
      .values({
        ...unpublishedArticleInput,
        author_id: userResult[0].id,
        category_id: categoryResult[0].id
      })
      .execute();

    const result = await getPublicArticles();

    expect(result).toHaveLength(0);
  });

  it('should include all required article fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        slug: testCategory.slug,
        description: testCategory.description
      })
      .returning()
      .execute();

    // Create published article with published_at timestamp
    await db.insert(articlesTable)
      .values({
        ...publishedArticleInput,
        author_id: userResult[0].id,
        category_id: categoryResult[0].id,
        published_at: new Date()
      })
      .execute();

    const result = await getPublicArticles();

    expect(result).toHaveLength(1);
    const article = result[0];

    // Verify all required fields are present
    expect(article.id).toBeDefined();
    expect(article.title).toEqual('Published Article');
    expect(article.slug).toEqual('published-article');
    expect(article.content).toEqual('This is a published article content');
    expect(article.excerpt).toEqual('Published article excerpt');
    expect(article.is_published).toBe(true);
    expect(article.author_id).toEqual(userResult[0].id);
    expect(article.category_id).toEqual(categoryResult[0].id);
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
    expect(article.published_at).toBeInstanceOf(Date);
  });
});
