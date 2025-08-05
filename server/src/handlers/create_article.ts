
import { db } from '../db';
import { usersTable, categoriesTable, articlesTable } from '../db/schema';
import { type CreateArticleInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export const createArticle = async (input: CreateArticleInput): Promise<Article> => {
  try {
    // Verify author exists
    const authors = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (authors.length === 0) {
      throw new Error('Author not found');
    }

    // Verify category exists if provided
    if (input.category_id !== null && input.category_id !== undefined) {
      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categories.length === 0) {
        throw new Error('Category not found');
      }
    }

    // Set published_at timestamp when is_published is true
    const publishedAt = input.is_published ? new Date() : null;

    // Insert article record
    const result = await db.insert(articlesTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt || null,
        is_published: input.is_published,
        author_id: input.author_id,
        category_id: input.category_id || null,
        published_at: publishedAt
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
};
