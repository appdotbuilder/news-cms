
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type StaticPage } from '../schema';

export async function getStaticPages(): Promise<StaticPage[]> {
  try {
    const results = await db.select()
      .from(staticPagesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch static pages:', error);
    throw error;
  }
}
