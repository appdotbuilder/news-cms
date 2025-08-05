
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, articlesTable, usersTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category', async () => {
    // Create test category
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .execute();

    const result = await deleteCategory(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testDeleteInput.id))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should return false when category does not exist', async () => {
    const result = await deleteCategory({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should set articles category_id to null when deleting category', async () => {
    // Create test user for articles
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpass',
        role: 'contributor'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .execute();

    // Create test articles referencing the category
    await db.insert(articlesTable)
      .values([
        {
          title: 'Article 1',
          slug: 'article-1',
          content: 'Content 1',
          author_id: userId,
          category_id: testDeleteInput.id,
          is_published: true
        },
        {
          title: 'Article 2',
          slug: 'article-2',
          content: 'Content 2',
          author_id: userId,
          category_id: testDeleteInput.id,
          is_published: false
        }
      ])
      .execute();

    const result = await deleteCategory(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify articles now have null category_id
    const articlesAfterDelete = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.author_id, userId))
      .execute();

    expect(articlesAfterDelete).toHaveLength(2);
    articlesAfterDelete.forEach(article => {
      expect(article.category_id).toBeNull();
    });

    // Verify category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testDeleteInput.id))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should handle deletion of category with no associated articles', async () => {
    // Create test category with no articles
    await db.insert(categoriesTable)
      .values({
        name: 'Lonely Category',
        slug: 'lonely-category',
        description: 'A category with no articles'
      })
      .execute();

    const result = await deleteCategory(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testDeleteInput.id))
      .execute();

    expect(categories).toHaveLength(0);
  });
});
