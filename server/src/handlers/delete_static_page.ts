
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteStaticPage(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the static page by ID
    const result = await db.delete(staticPagesTable)
      .where(eq(staticPagesTable.id, input.id))
      .returning()
      .execute();

    // Return success if a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Static page deletion failed:', error);
    throw error;
  }
}
