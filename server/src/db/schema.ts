
import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['guest', 'contributor', 'super_admin']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('contributor'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Articles table
export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  is_published: boolean('is_published').notNull().default(false),
  author_id: integer('author_id').notNull().references(() => usersTable.id),
  category_id: integer('category_id').references(() => categoriesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  published_at: timestamp('published_at'),
});

// Static pages table
export const staticPagesTable = pgTable('static_pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  articles: many(articlesTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  articles: many(articlesTable),
}));

export const articlesRelations = relations(articlesTable, ({ one }) => ({
  author: one(usersTable, {
    fields: [articlesTable.author_id],
    references: [usersTable.id],
  }),
  category: one(categoriesTable, {
    fields: [articlesTable.category_id], 
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
export type StaticPage = typeof staticPagesTable.$inferSelect;
export type NewStaticPage = typeof staticPagesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable,
  categories: categoriesTable, 
  articles: articlesTable,
  staticPages: staticPagesTable
};
