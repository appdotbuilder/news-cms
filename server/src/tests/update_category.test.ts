
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type CreateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Test inputs
const createTestCategory: CreateCategoryInput = {
  name: 'Original Category',
  slug: 'original-category',
  description: 'Original description'
};

const updateInput: UpdateCategoryInput = {
  id: 1,
  name: 'Updated Category',
  slug: 'updated-category',
  description: 'Updated description'
};

const partialUpdateInput: UpdateCategoryInput = {
  id: 1,
  name: 'Only Name Updated'
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all category fields', async () => {
    // Create initial category
    const [created] = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const updateData = { ...updateInput, id: created.id };
    const result = await updateCategory(updateData);

    // Verify updated fields
    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Category');
    expect(result.slug).toEqual('updated-category');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create initial category
    const [created] = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const updateData = { ...partialUpdateInput, id: created.id };
    const result = await updateCategory(updateData);

    // Verify only name was updated, other fields unchanged
    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Only Name Updated');
    expect(result.slug).toEqual(created.slug); // Should remain unchanged
    expect(result.description).toEqual(created.description); // Should remain unchanged
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should save changes to database', async () => {
    // Create initial category
    const [created] = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const updateData = { ...updateInput, id: created.id };
    await updateCategory(updateData);

    // Query database to verify changes were persisted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, created.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Category');
    expect(categories[0].slug).toEqual('updated-category');
    expect(categories[0].description).toEqual('Updated description');
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description update', async () => {
    // Create initial category with description
    const [created] = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const updateData: UpdateCategoryInput = {
      id: created.id,
      description: null
    };

    const result = await updateCategory(updateData);

    expect(result.description).toBeNull();
    expect(result.name).toEqual(created.name); // Should remain unchanged
    expect(result.slug).toEqual(created.slug); // Should remain unchanged
  });

  it('should throw error for non-existent category', async () => {
    const nonExistentUpdate: UpdateCategoryInput = {
      id: 999,
      name: 'Non-existent Category'
    };

    expect(updateCategory(nonExistentUpdate)).rejects.toThrow(/not found/i);
  });

  it('should throw error for duplicate slug', async () => {
    // Create two categories
    const [category1] = await db.insert(categoriesTable)
      .values({ ...createTestCategory, slug: 'category-1' })
      .returning()
      .execute();

    await db.insert(categoriesTable)
      .values({ ...createTestCategory, name: 'Category 2', slug: 'category-2' })
      .returning()
      .execute();

    // Try to update category1 with category2's slug
    const duplicateSlugUpdate: UpdateCategoryInput = {
      id: category1.id,
      slug: 'category-2'
    };

    expect(updateCategory(duplicateSlugUpdate)).rejects.toThrow();
  });
});
