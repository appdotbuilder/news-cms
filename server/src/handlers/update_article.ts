
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type UpdateArticleInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateArticle(input: UpdateArticleInput): Promise<Article> {
  try {
    // Check if article exists
    const existingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .execute();

    if (existingArticle.length === 0) {
      throw new Error('Article not found');
    }

    const current = existingArticle[0];

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Only update provided fields
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.excerpt !== undefined) {
      updateData.excerpt = input.excerpt;
    }
    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
      
      // Set published_at when article is being published for the first time
      if (input.is_published === true && !current.published_at) {
        updateData.published_at = new Date();
      }
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }

    // Update the article
    const result = await db.update(articlesTable)
      .set(updateData)
      .where(eq(articlesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
}
