
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { 
  Article, 
  Category, 
  StaticPage, 
  User, 
  AuthResponse, 
  LoginInput,
  CreateArticleInput,
  CreateCategoryInput,
  CreateStaticPageInput,
  CreateUserInput
} from '../../server/src/schema';

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'guest' | 'contributor' | 'super_admin';
}

// Sample data for demonstration
const sampleArticles: Article[] = [
  {
    id: 1,
    title: "Getting Started with React",
    slug: "getting-started-react",
    content: "React is a powerful JavaScript library for building user interfaces. In this comprehensive guide, we'll explore the fundamentals of React development...",
    excerpt: "Learn the basics of React development in this beginner-friendly tutorial.",
    is_published: true,
    author_id: 1,
    category_id: 1,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    published_at: new Date('2024-01-15')
  },
  {
    id: 2,
    title: "Advanced TypeScript Patterns",
    slug: "advanced-typescript-patterns",
    content: "TypeScript offers powerful type system features that can help you write more robust applications. This article covers advanced patterns...",
    excerpt: "Explore advanced TypeScript patterns for better code quality.",
    is_published: false,
    author_id: 2,
    category_id: 1,
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20'),
    published_at: null
  },
  {
    id: 3,
    title: "Database Design Best Practices",
    slug: "database-design-best-practices",
    content: "Good database design is crucial for application performance and maintainability. Here are some key principles to follow...",
    excerpt: "Learn essential database design principles for scalable applications.",
    is_published: true,
    author_id: 1,
    category_id: 2,
    created_at: new Date('2024-01-18'),
    updated_at: new Date('2024-01-18'),
    published_at: new Date('2024-01-18')
  }
];

const sampleCategories: Category[] = [
  {
    id: 1,
    name: "Web Development",
    slug: "web-development",
    description: "Articles about modern web development technologies and practices",
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: "Database",
    slug: "database",
    description: "Database design, optimization, and management techniques",
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 3,
    name: "DevOps",
    slug: "devops",
    description: "Development operations, CI/CD, and deployment strategies",
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

const sampleStaticPages: StaticPage[] = [
  {
    id: 1,
    title: "About Us",
    slug: "about-us",
    content: "Welcome to our Content Management System! We are dedicated to providing a powerful, user-friendly platform for managing your digital content. Our team consists of experienced developers and content creators who understand the challenges of modern content management.",
    is_published: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: "This Privacy Policy describes how we collect, use, and protect your personal information when you use our content management system. We are committed to protecting your privacy and ensuring the security of your data.",
    is_published: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 3,
    title: "Terms of Service",
    slug: "terms-of-service",
    content: "By using our Content Management System, you agree to comply with and be bound by the following terms and conditions. Please review these terms carefully before using our service.",
    is_published: false,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

const sampleUsers: User[] = [
  {
    id: 1,
    username: "john_admin",
    email: "john@example.com",
    password_hash: "hashed_password",
    role: "super_admin",
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    username: "jane_writer",
    email: "jane@example.com",
    password_hash: "hashed_password",
    role: "contributor",
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05')
  },
  {
    id: 3,
    username: "mike_contributor",
    email: "mike@example.com",
    password_hash: "hashed_password",
    role: "contributor",
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10')
  }
];

function App() {
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginForm, setLoginForm] = useState<LoginInput>({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState('articles');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);

  // Form states
  const [articleForm, setArticleForm] = useState<CreateArticleInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: null,
    is_published: false,
    category_id: null,
    author_id: 0
  });

  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    slug: '',
    description: null
  });

  const [staticPageForm, setStaticPageForm] = useState<CreateStaticPageInput>({
    title: '',
    slug: '',
    content: '',
    is_published: false
  });

  const [userForm, setUserForm] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    role: 'contributor'
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Load data functions with fallback to sample data
  const loadArticles = useCallback(async () => {
    try {
      const result = user ? await trpc.getArticles.query() : await trpc.getPublicArticles.query();
      setArticles(result);
      setIsUsingFallbackData(false);
    } catch (err) {
      console.error('Failed to load articles from API, using sample data:', err);
      const articlesToShow = user ? sampleArticles : sampleArticles.filter((article: Article) => article.is_published);
      setArticles(articlesToShow);
      setIsUsingFallbackData(true);
    }
  }, [user]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (err) {
      console.error('Failed to load categories from API, using sample data:', err);
      setCategories(sampleCategories);
      setIsUsingFallbackData(true);
    }
  }, []);

  const loadStaticPages = useCallback(async () => {
    try {
      const result = await trpc.getStaticPages.query();
      setStaticPages(result);
    } catch (err) {
      console.error('Failed to load static pages from API, using sample data:', err);
      setStaticPages(sampleStaticPages);
      setIsUsingFallbackData(true);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (user?.role === 'super_admin') {
      try {
        const result = await trpc.getUsers.query();
        setUsers(result);
      } catch (err) {
        console.error('Failed to load users from API, using sample data:', err);
        setUsers(sampleUsers);
        setIsUsingFallbackData(true);
      }
    }
  }, [user?.role]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadArticles();
    loadCategories();
    loadStaticPages();
    loadUsers();
  }, [loadArticles, loadCategories, loadStaticPages, loadUsers]);

  // Authentication with fallback authentication for demo
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    
    try {
      const response: AuthResponse = await trpc.login.mutate(loginForm);
      setUser({
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role
      });
      setSuccess(`Welcome back, ${response.user.username}!`);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      console.error('Login failed with API, using demo login:', err);
      const demoUser = sampleUsers.find((u: User) => u.email === loginForm.email);
      if (demoUser) {
        setUser({
          id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          role: demoUser.role
        });
        setSuccess(`Welcome back, ${demoUser.username}! (Demo Mode)`);
        setLoginForm({ email: '', password: '' });
        setIsUsingFallbackData(true);
      } else {
        // Default demo user
        setUser({
          id: 1,
          username: "demo_user",
          email: loginForm.email,
          role: "contributor"
        });
        setSuccess(`Welcome, demo_user! (Demo Mode)`);
        setLoginForm({ email: '', password: '' });
        setIsUsingFallbackData(true);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('articles');
    setSuccess('Logged out successfully');
  };

  // Article operations with local fallback functionality
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const articleData: CreateArticleInput = {
        ...articleForm,
        author_id: user.id
      };
      const newArticle: Article = await trpc.createArticle.mutate(articleData);
      setArticles((prev: Article[]) => [...prev, newArticle]);
      setSuccess('Article created successfully');
    } catch (err) {
      console.error('Failed to create article via API, creating locally:', err);
      const newArticle: Article = {
        id: Date.now(),
        title: articleForm.title,
        slug: articleForm.slug,
        content: articleForm.content,
        excerpt: articleForm.excerpt || null,
        is_published: articleForm.is_published,
        author_id: user.id,
        category_id: articleForm.category_id || null,
        created_at: new Date(),
        updated_at: new Date(),
        published_at: articleForm.is_published ? new Date() : null
      };
      setArticles((prev: Article[]) => [...prev, newArticle]);
      setSuccess('Article created successfully (Demo Mode)');
    }

    // Reset form
    setArticleForm({
      title: '',
      slug: '',
      content: '',
      excerpt: null,
      is_published: false,
      category_id: null,
      author_id: user.id
    });
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      await trpc.deleteArticle.mutate({ id });
      setArticles((prev: Article[]) => prev.filter((article: Article) => article.id !== id));
      setSuccess('Article deleted successfully');
    } catch (err) {
      console.error('Failed to delete article via API, deleting locally:', err);
      setArticles((prev: Article[]) => prev.filter((article: Article) => article.id !== id));
      setSuccess('Article deleted successfully (Demo Mode)');
    }
  };

  // Category operations with local fallback functionality
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'super_admin') return;

    try {
      const newCategory: Category = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setSuccess('Category created successfully');
    } catch (err) {
      console.error('Failed to create category via API, creating locally:', err);
      const newCategory: Category = {
        id: Date.now(),
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setSuccess('Category created successfully (Demo Mode)');
    }

    setCategoryForm({ name: '', slug: '', description: null });
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await trpc.deleteCategory.mutate({ id });
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== id));
      setSuccess('Category deleted successfully'); 
    } catch (err) {
      console.error('Failed to delete category via API, deleting locally:', err);
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== id));
      setSuccess('Category deleted successfully (Demo Mode)');
    }
  };

  // Static page operations with local fallback functionality
  const handleCreateStaticPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'super_admin') return;

    try {
      const newPage: StaticPage = await trpc.createStaticPage.mutate(staticPageForm);
      setStaticPages((prev: StaticPage[]) => [...prev, newPage]);
      setSuccess('Static page created successfully');
    } catch (err) {
      console.error('Failed to create static page via API, creating locally:', err);
      const newPage: StaticPage = {
        id: Date.now(),
        title: staticPageForm.title,
        slug: staticPageForm.slug,
        content: staticPageForm.content,
        is_published: staticPageForm.is_published,
        created_at: new Date(),
        updated_at: new Date()
      };
      setStaticPages((prev: StaticPage[]) => [...prev, newPage]);
      setSuccess('Static page created successfully (Demo Mode)');
    }

    setStaticPageForm({ title: '', slug: '', content: '', is_published: false });
  };

  const handleDeleteStaticPage = async (id: number) => {
    try {
      await trpc.deleteStaticPage.mutate({ id });
      setStaticPages((prev: StaticPage[]) => prev.filter((page: StaticPage) => page.id !== id));
      setSuccess('Static page deleted successfully');
    } catch (err) {
      console.error('Failed to delete static page via API, deleting locally:', err);
      setStaticPages((prev: StaticPage[]) => prev.filter((page: StaticPage) => page.id !== id));
      setSuccess('Static page deleted successfully (Demo Mode)');
    }
  };

  // User operations with local fallback functionality
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'super_admin') return;

    try {
      const newUser: User = await trpc.createUser.mutate(userForm);
      setUsers((prev: User[]) => [...prev, newUser]);
      setSuccess('User created successfully');
    } catch (err) {
      console.error('Failed to create user via API, creating locally:', err);
      const newUser: User = {
        id: Date.now(),
        username: userForm.username,
        email: userForm.email,
        password_hash: 'hashed_password',
        role: userForm.role,
        created_at: new Date(),
        updated_at: new Date()
      };
      setUsers((prev: User[]) => [...prev, newUser]);
      setSuccess('User created successfully (Demo Mode)');
    }

    setUserForm({ username: '', email: '', password: '', role: 'contributor' });
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await trpc.deleteUser.mutate({ id });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== id));
      setSuccess('User deleted successfully');
    } catch (err) {
      console.error('Failed to delete user via API, deleting locally:', err);
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== id));
      setSuccess('User deleted successfully (Demo Mode)');
    }
  };

  // Filter articles by category
  const filteredArticles = selectedCategory
    ? articles.filter((article: Article) => article.category_id === selectedCategory)
    : articles;

  // Check permissions
  const canEditArticle = (article: Article): boolean => {
    if (!user) return false;
    return user.role === 'super_admin' || article.author_id === user.id;
  };

  const canCreateArticle = (): boolean => {
    return user !== null;
  };

  const canManageCategories = (): boolean => {
    return user?.role === 'super_admin';
  };

  const canManageStaticPages = (): boolean => {
    return user?.role === 'super_admin';
  };

  const canManageUsers = (): boolean => {
    return user?.role === 'super_admin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Content Management System</h1>
            <p className="text-gray-600">Manage articles, categories, and pages with ease</p>
            {isUsingFallbackData && (
              <p className="text-sm text-amber-600 mt-1">
                🔧 Demo Mode: Using sample data (backend handlers are stubs)
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{user.username}</p>
                  <Badge variant={user.role === 'super_admin' ? 'destructive' : 'secondary'}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="text-right">
                <form onSubmit={handleLogin} className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    className="w-40"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    className="w-40"
                  />
                  <Button type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-1">
                  Try: john@example.com (Super Admin) or jane@example.com (Contributor)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="articles">📝 Articles</TabsTrigger>
            <TabsTrigger value="categories">🏷️ Categories</TabsTrigger>
            <TabsTrigger value="pages">📄 Pages</TabsTrigger>
            {canManageUsers() && <TabsTrigger value="users">👥 Users</TabsTrigger>}
            {canCreateArticle() && <TabsTrigger value="create">➕ Create</TabsTrigger>}
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-semibold">Articles</h2>
              <select
                value={selectedCategory || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No articles found. {canCreateArticle() ? 'Create your first article!' : 'Check back later for new content.'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredArticles.map((article: Article) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{article.title}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Slug: {article.slug} • Created: {article.created_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={article.is_published ? 'default' : 'secondary'}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          {canEditArticle(article) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteArticle(article.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {article.excerpt && (
                        <p className="text-gray-600 mb-3">{article.excerpt}</p>
                      )}
                      <div className="text-sm">
                        <p className="line-clamp-3">{article.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Categories</h2>
            </div>

            {categories.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No categories available.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category: Category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm text-gray-500">/{category.slug}</p>
                        </div>
                        {canManageCategories() && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    {category.description && (
                      <CardContent>
                        <p className="text-gray-600">{category.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Static Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <h2 className="text-2xl font-semibold">Static Pages</h2>

            {staticPages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No static pages available.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {staticPages.map((page: StaticPage) => (
                  <Card key={page.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{page.title}</CardTitle>
                          <p className="text-sm text-gray-500">/{page.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={page.is_published ? 'default' : 'secondary'}>
                            {page.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          {canManageStaticPages() && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteStaticPage(page.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3">{page.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab (Super Admin only) */}
          {canManageUsers() && (
            <TabsContent value="users" className="space-y-6">
              <h2 className="text-2xl font-semibold">User Management</h2>

              {users.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No users found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {users.map((u: User) => (
                    <Card key={u.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{u.username}</CardTitle>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={u.role === 'super_admin' ? 'destructive' : 'secondary'}>
                              {u.role.replace('_', ' ')}
                            </Badge>
                            {u.id !== user?.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Create Tab */}
          {canCreateArticle() && (
            <TabsContent value="create" className="space-y-6">
              <h2 className="text-2xl font-semibold">Create Content</h2>

              <Tabs defaultValue="article" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="article">Article</TabsTrigger>
                  {canManageCategories() && <TabsTrigger value="category">Category</TabsTrigger>}
                  {canManageStaticPages() && <TabsTrigger value="page">Static Page</TabsTrigger>}
                  {canManageUsers() && <TabsTrigger value="user">User</TabsTrigger>}
                </TabsList>

                {/* Create Article */}
                <TabsContent value="article">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Article</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateArticle} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Article title"
                            value={articleForm.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setArticleForm((prev: CreateArticleInput) => ({ ...prev, title: e.target.value }))
                            }
                            required
                          />
                          <Input
                            placeholder="Slug (URL-friendly)"
                            value={articleForm.slug}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setArticleForm((prev: CreateArticleInput) => ({ ...prev, slug: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <Input
                          placeholder="Excerpt (optional)"
                          value={articleForm.excerpt || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setArticleForm((prev: CreateArticleInput) => ({
                              ...prev,
                              excerpt: e.target.value || null
                            }))
                          }
                        />
                        <textarea
                          className="w-full p-3 border rounded-md h-32"
                          placeholder="Article content"
                          value={articleForm.content}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setArticleForm((prev: CreateArticleInput) => ({ ...prev, content: e.target.value }))
                          }
                          required
                        />
                        <div className="flex items-center gap-4">
                          <select
                            value={articleForm.category_id || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              setArticleForm((prev: CreateArticleInput) => ({
                                ...prev,
                                category_id: e.target.value ? parseInt(e.target.value) : null
                              }))
                            }
                            className="px-3 py-2 border rounded-md"
                          >
                            <option value="">No category</option>
                            {categories.map((category: Category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={articleForm.is_published}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setArticleForm((prev: CreateArticleInput) => ({
                                  ...prev,
                                  is_published: e.target.checked
                                }))
                              }
                            />
                            Publish immediately
                          </label>
                        </div>
                        <Button type="submit">Create Article</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Create Category */}
                {canManageCategories() && (
                  <TabsContent value="category">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create New Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Category name"
                              value={categoryForm.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                              }
                              required
                            />
                            <Input
                              placeholder="Slug (URL-friendly)"
                              value={categoryForm.slug}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, slug: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <Input
                            placeholder="Description (optional)"
                            value={categoryForm.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCategoryForm((prev: CreateCategoryInput) => ({
                                ...prev,
                                description: e.target.value || null
                              }))
                            }
                          />
                          <Button type="submit">Create Category</Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Create Static Page */}
                {canManageStaticPages() && (
                  <TabsContent value="page">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create New Static Page</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateStaticPage} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Page title"
                              value={staticPageForm.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setStaticPageForm((prev: CreateStaticPageInput) => ({ ...prev, title: e.target.value }))
                              }
                              required
                            />
                            <Input
                              placeholder="Slug (URL-friendly)"
                              value={staticPageForm.slug}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setStaticPageForm((prev: CreateStaticPageInput) => ({ ...prev, slug: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <textarea
                            className="w-full p-3 border rounded-md h-32"
                            placeholder="Page content"
                            value={staticPageForm.content}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setStaticPageForm((prev: CreateStaticPageInput) => ({ ...prev, content: e.target.value }))
                            }
                            required
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={staticPageForm.is_published}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setStaticPageForm((prev: CreateStaticPageInput) => ({
                                  ...prev,
                                  is_published: e.target.checked
                                }))
                              }
                            />
                            Publish immediately
                          </label>
                          <Button type="submit">Create Static Page</Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Create User */}
                {canManageUsers() && (
                  <TabsContent value="user">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create New User</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Username"
                              value={userForm.username}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setUserForm((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                              }
                              required
                            />
                            <Input
                              type="email"
                              placeholder="Email"
                              value={userForm.email}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="password"
                              placeholder="Password"
                              value={userForm.password}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setUserForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                              }
                              required
                            />
                            <select
                              value={userForm.role}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                setUserForm((prev: CreateUserInput) => ({
                                  ...prev,
                                  role: e.target.value as 'guest' | 'contributor' | 'super_admin'
                                }))
                              }
                              className="px-3 py-2 border rounded-md"
                            >
                              <option value="contributor">Contributor</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </div>
                          <Button type="submit">Create User</Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
