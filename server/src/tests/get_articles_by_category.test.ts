
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, articlesTable } from '../db/schema';
import { type GetCategoryArticlesInput } from '../schema';
import { getArticlesByCategory } from '../handlers/get_articles_by_category';

describe('getArticlesByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return articles for a specific category', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create another category for testing filtering
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Science',
        slug: 'science',
        description: 'Science articles'
      })
      .returning()
      .execute();

    const otherCategoryId = otherCategoryResult[0].id;

    // Create articles in the target category
    await db.insert(articlesTable)
      .values([
        {
          title: 'Tech Article 1',
          slug: 'tech-article-1',
          content: 'Content about technology',
          excerpt: 'Tech excerpt',
          is_published: true,
          author_id: userId,
          category_id: categoryId
        },
        {
          title: 'Tech Article 2',
          slug: 'tech-article-2',
          content: 'More tech content',
          excerpt: 'Another tech excerpt',
          is_published: false,
          author_id: userId,
          category_id: categoryId
        }
      ])
      .execute();

    // Create article in different category
    await db.insert(articlesTable)
      .values({
        title: 'Science Article',
        slug: 'science-article',
        content: 'Content about science',
        excerpt: 'Science excerpt',
        is_published: true,
        author_id: userId,
        category_id: otherCategoryId
      })
      .execute();

    const input: GetCategoryArticlesInput = {
      categoryId: categoryId
    };

    const result = await getArticlesByCategory(input);

    // Should return only articles from the specified category
    expect(result).toHaveLength(2);
    
    // Verify article details
    const publishedArticle = result.find(article => article.title === 'Tech Article 1');
    const unpublishedArticle = result.find(article => article.title === 'Tech Article 2');
    
    expect(publishedArticle).toBeDefined();
    expect(publishedArticle!.title).toEqual('Tech Article 1');
    expect(publishedArticle!.slug).toEqual('tech-article-1');
    expect(publishedArticle!.content).toEqual('Content about technology');
    expect(publishedArticle!.is_published).toBe(true);
    expect(publishedArticle!.category_id).toEqual(categoryId);
    expect(publishedArticle!.author_id).toEqual(userId);
    expect(publishedArticle!.created_at).toBeInstanceOf(Date);
    expect(publishedArticle!.updated_at).toBeInstanceOf(Date);

    expect(unpublishedArticle).toBeDefined();
    expect(unpublishedArticle!.title).toEqual('Tech Article 2');
    expect(unpublishedArticle!.is_published).toBe(false);
    expect(unpublishedArticle!.category_id).toEqual(categoryId);
  });

  it('should return empty array for category with no articles', async () => {
    // Create test user and category
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'contributor'
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        slug: 'empty-category',
        description: 'No articles here'
      })
      .returning()
      .execute();

    const input: GetCategoryArticlesInput = {
      categoryId: categoryResult[0].id
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent category', async () => {
    const input: GetCategoryArticlesInput = {
      categoryId: 999999 // Non-existent category ID
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(0);
  });
});
