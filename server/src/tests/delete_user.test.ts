
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, articlesTable, categoriesTable } from '../db/schema';
import { type DeleteInput, type CreateUserInput, type CreateArticleInput, type CreateCategoryInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'contributor'
};

const testCategoryInput: CreateCategoryInput = {
  name: 'Test Category',
  slug: 'test-category',
  description: 'A test category'
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        password_hash: 'hashed_password',
        role: testUserInput.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const deleteInput: DeleteInput = { id: userId };

    // Delete the user
    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when deleting non-existent user', async () => {
    const deleteInput: DeleteInput = { id: 999 };

    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should handle cascading deletes for user articles', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        password_hash: 'hashed_password',
        role: testUserInput.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        slug: testCategoryInput.slug,
        description: testCategoryInput.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test article by the user
    const articleInput: CreateArticleInput = {
      title: 'Test Article',
      slug: 'test-article',
      content: 'Test content',
      excerpt: 'Test excerpt',
      is_published: true,
      author_id: userId,
      category_id: categoryId
    };

    const articleResult = await db.insert(articlesTable)
      .values({
        title: articleInput.title,
        slug: articleInput.slug,
        content: articleInput.content,
        excerpt: articleInput.excerpt,
        is_published: articleInput.is_published,
        author_id: articleInput.author_id,
        category_id: articleInput.category_id
      })
      .returning()
      .execute();

    const articleId = articleResult[0].id;

    // Delete the user
    const deleteInput: DeleteInput = { id: userId };
    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify articles by the user are also deleted
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(0);

    // Verify category still exists (should not be affected)
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should delete multiple users correctly', async () => {
    // Create multiple test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        role: 'contributor'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        role: 'contributor'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Delete first user
    const deleteInput1: DeleteInput = { id: user1Id };
    const result1 = await deleteUser(deleteInput1);

    expect(result1.success).toBe(true);

    // Verify first user is deleted, second still exists
    const user1Check = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user1Id))
      .execute();

    const user2Check = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user2Id))
      .execute();

    expect(user1Check).toHaveLength(0);
    expect(user2Check).toHaveLength(1);

    // Delete second user
    const deleteInput2: DeleteInput = { id: user2Id };
    const result2 = await deleteUser(deleteInput2);

    expect(result2.success).toBe(true);

    // Verify second user is also deleted
    const finalCheck = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user2Id))
      .execute();

    expect(finalCheck).toHaveLength(0);
  });

  it('should delete user with multiple articles', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        password_hash: 'hashed_password',
        role: testUserInput.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        slug: testCategoryInput.slug,
        description: testCategoryInput.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple test articles by the user
    const article1Result = await db.insert(articlesTable)
      .values({
        title: 'Test Article 1',
        slug: 'test-article-1',
        content: 'Test content 1',
        excerpt: 'Test excerpt 1',
        is_published: true,
        author_id: userId,
        category_id: categoryId
      })
      .returning()
      .execute();

    const article2Result = await db.insert(articlesTable)
      .values({
        title: 'Test Article 2',
        slug: 'test-article-2',
        content: 'Test content 2',
        excerpt: 'Test excerpt 2',
        is_published: false,
        author_id: userId,
        category_id: categoryId
      })
      .returning()
      .execute();

    const article1Id = article1Result[0].id;
    const article2Id = article2Result[0].id;

    // Delete the user
    const deleteInput: DeleteInput = { id: userId };
    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify both articles by the user are deleted
    const articles1 = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article1Id))
      .execute();

    const articles2 = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article2Id))
      .execute();

    expect(articles1).toHaveLength(0);
    expect(articles2).toHaveLength(0);
  });
});
