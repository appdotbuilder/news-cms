
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  updateUserInputSchema,
  deleteInputSchema,
  loginInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createArticleInputSchema,
  updateArticleInputSchema,
  getCategoryArticlesInputSchema,
  createStaticPageInputSchema,
  updateStaticPageInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { getUsers } from './handlers/get_users';
import { login } from './handlers/login';
import { createCategory } from './handlers/create_category';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { getCategories } from './handlers/get_categories';
import { createArticle } from './handlers/create_article';
import { updateArticle } from './handlers/update_article';
import { deleteArticle } from './handlers/delete_article';
import { getArticles } from './handlers/get_articles';
import { getPublicArticles } from './handlers/get_public_articles';
import { getArticlesByCategory } from './handlers/get_articles_by_category';
import { createStaticPage } from './handlers/create_static_page';
import { updateStaticPage } from './handlers/update_static_page';
import { deleteStaticPage } from './handlers/delete_static_page';
import { getStaticPages } from './handlers/get_static_pages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // User management (Super Admin only)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Category management
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  
  deleteCategory: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteCategory(input)),
  
  getCategories: publicProcedure
    .query(() => getCategories()),

  // Article management
  createArticle: publicProcedure
    .input(createArticleInputSchema)
    .mutation(({ input }) => createArticle(input)),
  
  updateArticle: publicProcedure
    .input(updateArticleInputSchema)
    .mutation(({ input }) => updateArticle(input)),
  
  deleteArticle: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteArticle(input)),
  
  getArticles: publicProcedure
    .query(() => getArticles()),
  
  getPublicArticles: publicProcedure
    .query(() => getPublicArticles()),
  
  getArticlesByCategory: publicProcedure
    .input(getCategoryArticlesInputSchema)
    .query(({ input }) => getArticlesByCategory(input)),

  // Static page management
  createStaticPage: publicProcedure
    .input(createStaticPageInputSchema)
    .mutation(({ input }) => createStaticPage(input)),
  
  updateStaticPage: publicProcedure
    .input(updateStaticPageInputSchema)
    .mutation(({ input }) => updateStaticPage(input)),
  
  deleteStaticPage: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteStaticPage(input)),
  
  getStaticPages: publicProcedure
    .query(() => getStaticPages()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
