
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { getStaticPages } from '../handlers/get_static_pages';

describe('getStaticPages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no static pages exist', async () => {
    const result = await getStaticPages();
    expect(result).toEqual([]);
  });

  it('should return all static pages', async () => {
    // Create test static pages
    await db.insert(staticPagesTable).values([
      {
        title: 'About Us',
        slug: 'about-us',
        content: 'This is the about us page',
        is_published: true
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: 'This is the privacy policy',
        is_published: false
      },
      {
        title: 'Terms of Service',
        slug: 'terms-of-service',
        content: 'These are the terms of service',
        is_published: true
      }
    ]).execute();

    const result = await getStaticPages();

    expect(result).toHaveLength(3);
    
    // Check that all pages are returned regardless of published status
    const titles = result.map(page => page.title).sort();
    expect(titles).toEqual(['About Us', 'Privacy Policy', 'Terms of Service']);

    // Verify structure of returned pages
    result.forEach(page => {
      expect(page.id).toBeDefined();
      expect(page.title).toBeDefined();
      expect(page.slug).toBeDefined();
      expect(page.content).toBeDefined();
      expect(typeof page.is_published).toBe('boolean');
      expect(page.created_at).toBeInstanceOf(Date);
      expect(page.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return pages with correct field values', async () => {
    // Create a specific test page
    await db.insert(staticPagesTable).values({
      title: 'Contact Us',
      slug: 'contact-us',
      content: 'Contact information goes here',
      is_published: true
    }).execute();

    const result = await getStaticPages();

    expect(result).toHaveLength(1);
    const page = result[0];
    
    expect(page.title).toEqual('Contact Us');
    expect(page.slug).toEqual('contact-us');
    expect(page.content).toEqual('Contact information goes here');
    expect(page.is_published).toBe(true);
    expect(page.created_at).toBeInstanceOf(Date);
    expect(page.updated_at).toBeInstanceOf(Date);
  });
});
