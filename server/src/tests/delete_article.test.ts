
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, usersTable, categoriesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteArticle } from '../handlers/delete_article';
import { eq } from 'drizzle-orm';

describe('deleteArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing article', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'contributor'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        is_published: true,
        author_id: user.id,
        category_id: null
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Delete the article
    const input: DeleteInput = { id: article.id };
    const result = await deleteArticle(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify article is deleted from database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article.id))
      .execute();

    expect(articles).toHaveLength(0);
  });

  it('should return false for non-existent article', async () => {
    const input: DeleteInput = { id: 999 };
    const result = await deleteArticle(input);

    // Should return false since no article was deleted
    expect(result.success).toBe(false);
  });

  it('should delete article with category relationship', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'contributor'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create test article with category
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article with Category',
        slug: 'test-article-category',
        content: 'This is test content with category',
        excerpt: 'Test excerpt',
        is_published: true,
        author_id: user.id,
        category_id: category.id
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Delete the article
    const input: DeleteInput = { id: article.id };
    const result = await deleteArticle(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify article is deleted from database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article.id))
      .execute();

    expect(articles).toHaveLength(0);

    // Verify category still exists (foreign key constraint should not prevent deletion)
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should handle multiple articles and delete only specified one', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'contributor'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create multiple test articles
    const article1Result = await db.insert(articlesTable)
      .values({
        title: 'Test Article 1',
        slug: 'test-article-1',
        content: 'Content 1',
        author_id: user.id,
        is_published: true
      })
      .returning()
      .execute();

    const article2Result = await db.insert(articlesTable)
      .values({
        title: 'Test Article 2',
        slug: 'test-article-2',
        content: 'Content 2',
        author_id: user.id,
        is_published: false
      })
      .returning()
      .execute();

    const article1 = article1Result[0];
    const article2 = article2Result[0];

    // Delete only the first article
    const input: DeleteInput = { id: article1.id };
    const result = await deleteArticle(input);

    expect(result.success).toBe(true);

    // Verify first article is deleted
    const deletedArticles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article1.id))
      .execute();

    expect(deletedArticles).toHaveLength(0);

    // Verify second article still exists
    const remainingArticles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article2.id))
      .execute();

    expect(remainingArticles).toHaveLength(1);
    expect(remainingArticles[0].title).toEqual('Test Article 2');
  });
});
