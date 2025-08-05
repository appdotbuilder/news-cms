
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, articlesTable } from '../db/schema';
import { getArticles } from '../handlers/get_articles';

describe('getArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no articles exist', async () => {
    const result = await getArticles();
    expect(result).toEqual([]);
  });

  it('should return all articles for super_admin role', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create published and unpublished articles
    await db.insert(articlesTable)
      .values([
        {
          title: 'Published Article',
          slug: 'published-article',
          content: 'Published content',
          excerpt: 'Published excerpt',
          is_published: true,
          author_id: user.id,
          category_id: category.id,
          published_at: new Date()
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'Draft content',
          excerpt: 'Draft excerpt',
          is_published: false,
          author_id: user.id,
          category_id: category.id
        }
      ])
      .execute();

    const result = await getArticles('super_admin');

    expect(result).toHaveLength(2);
    expect(result.some(a => a.title === 'Published Article')).toBe(true);
    expect(result.some(a => a.title === 'Draft Article')).toBe(true);
  });

  it('should return all articles for contributor role', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    // Create published and unpublished articles
    await db.insert(articlesTable)
      .values([
        {
          title: 'Published Article',
          slug: 'published-article',
          content: 'Published content',
          is_published: true,
          author_id: user.id,
          published_at: new Date()
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'Draft content',
          is_published: false,
          author_id: user.id
        }
      ])
      .execute();

    const result = await getArticles('contributor');

    expect(result).toHaveLength(2);
    expect(result.some(a => a.title === 'Published Article')).toBe(true);
    expect(result.some(a => a.title === 'Draft Article')).toBe(true);
  });

  it('should return only published articles for guest role', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    // Create published and unpublished articles
    await db.insert(articlesTable)
      .values([
        {
          title: 'Published Article',
          slug: 'published-article',
          content: 'Published content',
          is_published: true,
          author_id: user.id,
          published_at: new Date()
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'Draft content',
          is_published: false,
          author_id: user.id
        }
      ])
      .execute();

    const result = await getArticles('guest');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published Article');
    expect(result[0].is_published).toBe(true);
  });

  it('should return only published articles when no role specified', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    // Create published and unpublished articles
    await db.insert(articlesTable)
      .values([
        {
          title: 'Published Article',
          slug: 'published-article',
          content: 'Published content',
          is_published: true,
          author_id: user.id,
          published_at: new Date()
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'Draft content',
          is_published: false,
          author_id: user.id
        }
      ])
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published Article');
    expect(result[0].is_published).toBe(true);
  });

  it('should include all article fields in response', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create article with all fields
    await db.insert(articlesTable)
      .values({
        title: 'Full Article',
        slug: 'full-article',
        content: 'Full content',
        excerpt: 'Full excerpt',
        is_published: true,
        author_id: user.id,
        category_id: category.id,
        published_at: new Date()
      })
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    const article = result[0];
    
    expect(article.id).toBeDefined();
    expect(article.title).toEqual('Full Article');
    expect(article.slug).toEqual('full-article');
    expect(article.content).toEqual('Full content');
    expect(article.excerpt).toEqual('Full excerpt');
    expect(article.is_published).toBe(true);
    expect(article.author_id).toEqual(user.id);
    expect(article.category_id).toEqual(category.id);
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
    expect(article.published_at).toBeInstanceOf(Date);
  });

  it('should handle articles without category', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    // Create article without category
    await db.insert(articlesTable)
      .values({
        title: 'No Category Article',
        slug: 'no-category-article',
        content: 'Content without category',
        is_published: true,
        author_id: user.id,
        category_id: null
      })
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('No Category Article');
    expect(result[0].category_id).toBeNull();
  });
});
