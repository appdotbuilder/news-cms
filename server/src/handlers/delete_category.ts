
import { db } from '../db';
import { categoriesTable, articlesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCategory(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, update all articles that reference this category to set category_id to null
    await db.update(articlesTable)
      .set({ category_id: null })
      .where(eq(articlesTable.category_id, input.id))
      .execute();

    // Then delete the category
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    // Return success true if a category was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
