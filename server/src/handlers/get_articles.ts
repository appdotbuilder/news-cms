
import { db } from '../db';
import { articlesTable, usersTable, categoriesTable } from '../db/schema';
import { type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function getArticles(userRole?: string): Promise<Article[]> {
  try {
    // Build base query first
    let baseQuery = db.select({
      // Article fields
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
    .leftJoin(usersTable, eq(articlesTable.author_id, usersTable.id))
    .leftJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id));

    // Apply role-based filtering
    let query;
    if (userRole === 'guest' || !userRole) {
      // Guests see only published articles
      query = baseQuery.where(eq(articlesTable.is_published, true));
    } else {
      // Contributors and super_admins see all articles
      query = baseQuery;
    }

    const results = await query.execute();

    // Convert results to Article type
    return results.map(result => ({
      id: result.id,
      title: result.title,
      slug: result.slug,
      content: result.content,
      excerpt: result.excerpt,
      is_published: result.is_published,
      author_id: result.author_id,
      category_id: result.category_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      published_at: result.published_at,
    }));
  } catch (error) {
    console.error('Failed to get articles:', error);
    throw error;
  }
}
