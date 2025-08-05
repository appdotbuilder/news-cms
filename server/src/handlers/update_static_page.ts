
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type UpdateStaticPageInput, type StaticPage } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStaticPage = async (input: UpdateStaticPageInput): Promise<StaticPage> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
    }

    // Update static page record
    const result = await db.update(staticPagesTable)
      .set(updateData)
      .where(eq(staticPagesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Static page with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Static page update failed:', error);
    throw error;
  }
};
