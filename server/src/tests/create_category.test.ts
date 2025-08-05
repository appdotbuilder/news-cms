
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  slug: 'test-category',
  description: 'A category for testing'
};

// Test input without optional description
const minimalInput: CreateCategoryInput = {
  name: 'Minimal Category',
  slug: 'minimal-category'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with all fields', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.slug).toEqual('test-category');
    expect(result.description).toEqual('A category for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category without description', async () => {
    const result = await createCategory(minimalInput);

    expect(result.name).toEqual('Minimal Category');
    expect(result.slug).toEqual('minimal-category');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].slug).toEqual('test-category');
    expect(categories[0].description).toEqual('A category for testing');
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique slug constraint', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create another category with the same slug
    const duplicateInput: CreateCategoryInput = {
      name: 'Different Name',
      slug: 'test-category', // Same slug as first category
      description: 'Different description'
    };

    await expect(createCategory(duplicateInput)).rejects.toThrow(/unique constraint/i);
  });

  it('should handle empty description correctly', async () => {
    const inputWithEmptyDescription: CreateCategoryInput = {
      name: 'Empty Description Category',
      slug: 'empty-desc-category',
      description: null
    };

    const result = await createCategory(inputWithEmptyDescription);

    expect(result.description).toBeNull();

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });
});
