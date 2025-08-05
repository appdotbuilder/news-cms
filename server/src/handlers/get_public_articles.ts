
import { db } from '../db';
import { articlesTable, usersTable, categoriesTable } from '../db/schema';
import { type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPublicArticles(): Promise<Article[]> {
  try {
    // Query published articles with author and category information
    const results = await db
      .select({
        id: articlesTable.id,
        title: articlesTable.title,
        slug: articlesTable.slug,
        content: articlesTable.content,
        excerpt: articlesTable.excerpt,
        is_published: articlesTable.is_published,
        author_id: articlesTable.author_id,
        category_id: articlesTable.category_id,
        created_at: articlesTable.created_at,
        updated_at: articlesTable.updated_at,
        published_at: articlesTable.published_at,
      })
      .from(articlesTable)
      .innerJoin(usersTable, eq(articlesTable.author_id, usersTable.id))
      .leftJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id))
      .where(eq(articlesTable.is_published, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch public articles:', error);
    throw error;
  }
}
