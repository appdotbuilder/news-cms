
import { db } from '../db';
import { usersTable, articlesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, delete all articles by this user to avoid foreign key constraint violation
    await db.delete(articlesTable)
      .where(eq(articlesTable.author_id, input.id))
      .execute();

    // Then delete the user
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    // Return success if a user was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}
