
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type CreateStaticPageInput, type StaticPage } from '../schema';

export const createStaticPage = async (input: CreateStaticPageInput): Promise<StaticPage> => {
  try {
    // Insert static page record
    const result = await db.insert(staticPagesTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        is_published: input.is_published
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Static page creation failed:', error);
    throw error;
  }
};
