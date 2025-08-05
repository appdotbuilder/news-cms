
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Technology',
          slug: 'technology',
          description: 'Tech articles'
        },
        {
          name: 'Science',
          slug: 'science',
          description: 'Science articles'
        },
        {
          name: 'Health',
          slug: 'health',
          description: null
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify category properties
    const techCategory = result.find(cat => cat.slug === 'technology');
    expect(techCategory).toBeDefined();
    expect(techCategory!.name).toEqual('Technology');
    expect(techCategory!.description).toEqual('Tech articles');
    expect(techCategory!.id).toBeDefined();
    expect(techCategory!.created_at).toBeInstanceOf(Date);
    expect(techCategory!.updated_at).toBeInstanceOf(Date);

    // Verify category with null description
    const healthCategory = result.find(cat => cat.slug === 'health');
    expect(healthCategory).toBeDefined();
    expect(healthCategory!.description).toBeNull();
  });

  it('should return categories in order they were created', async () => {
    // Create categories in specific order
    const category1 = await db.insert(categoriesTable)
      .values({
        name: 'First Category',
        slug: 'first',
        description: 'First'
      })
      .returning()
      .execute();

    const category2 = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        slug: 'second',
        description: 'Second'
      })
      .returning()
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(category1[0].id);
    expect(result[1].id).toEqual(category2[0].id);
  });
});
