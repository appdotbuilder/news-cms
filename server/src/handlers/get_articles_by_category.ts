
import { db } from '../db';
import { articlesTable, usersTable, categoriesTable } from '../db/schema';
import { type GetCategoryArticlesInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function getArticlesByCategory(input: GetCategoryArticlesInput): Promise<Article[]> {
  try {
    // Query articles with joins to get author and category information
    const results = await db.select()
      .from(articlesTable)
      .innerJoin(usersTable, eq(articlesTable.author_id, usersTable.id))
      .innerJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id))
      .where(eq(articlesTable.category_id, input.categoryId))
      .execute();

    // Map the joined results back to Article format
    return results.map(result => ({
      id: result.articles.id,
      title: result.articles.title,
      slug: result.articles.slug,
      content: result.articles.content,
      excerpt: result.articles.excerpt,
      is_published: result.articles.is_published,
      author_id: result.articles.author_id,
      category_id: result.articles.category_id,
      created_at: result.articles.created_at,
      updated_at: result.articles.updated_at,
      published_at: result.articles.published_at
    }));
  } catch (error) {
    console.error('Get articles by category failed:', error);
    throw error;
  }
}
