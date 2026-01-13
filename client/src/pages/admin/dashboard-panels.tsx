import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authenticatedFetch, getAdminUser, isAuthenticated } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsRecord {
  id: number;
  date: string;
  pageViews: number | null;
  uniqueVisitors: number | null;
  bounceRate: number | null;
  avgSessionDuration: number | null;
  conversionRate: number | null;
  topPages: string[];
  trafficSources: Record<string, number>;
  deviceTypes: Record<string, number>;
}

interface AnalyticsOverviewResponse {
  latest: AnalyticsRecord | null;
  history: AnalyticsRecord[];
}

interface CustomerRecord {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt?: string | null;
  source: 'housecall_pro' | 'database';
}

interface CustomerResponse {
  source: string;
  customers: CustomerRecord[];
  total: number;
  page: number;
  totalPages: number | null;
  fetchedAt: string;
}

interface GoogleAdsCampaign {
  id: number;
  campaignId: string;
  campaignName: string;
  status: string;
  type: string;
  budget: number | null;
  impressions: number | null;
  clicks: number | null;
  cost: number | null;
  conversions: number | null;
  conversionValue: number | null;
  lastSyncedAt: string | null;
  updatedAt: string;
}

interface WebhookEvent {
  id: number;
  eventType: string;
  eventCategory: string;
  status: string;
  error: string | null;
  receivedAt: string;
  entityId: string | null;
}

interface TaskRecord {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignedTo?: number | null;
  createdAt: string;
}

interface AiChatSession {
  id: number;
  title: string;
  context?: string | null;
  updatedAt: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  publishDate: string | null;
  updatedAt: string;
}

interface AuthMeResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  permissions: string[];
}

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const blogFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  status: z.enum(['draft', 'review', 'published', 'scheduled']),
  excerpt: z.string().max(400).optional().or(z.literal('')),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  featuredImage: z.string().url('Featured image must be a valid URL').optional().or(z.literal('')),
  metaTitle: z.string().max(60).optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  author: z.string().max(120).optional().or(z.literal('')),
  category: z.string().max(80).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  keywords: z.string().optional().or(z.literal('')),
  publishDate: z.string().optional().or(z.literal('')),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const toLocalInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoString = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const toDelimitedList = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export function AnalyticsPanel() {
  const { data, isLoading } = useQuery<AnalyticsOverviewResponse>({
    queryKey: ['/api/admin/analytics/overview'],
    queryFn: () => authenticatedFetch('/api/admin/analytics/overview'),
    enabled: isAuthenticated(),
  });

  const latest = data?.latest;

  const topPages = useMemo(() => latest?.topPages?.slice(0, 5) || [], [latest?.topPages]);
  const trafficSources = useMemo(() => Object.entries(latest?.trafficSources || {}).slice(0, 5), [latest?.trafficSources]);
  const deviceTypes = useMemo(() => Object.entries(latest?.deviceTypes || {}).slice(0, 5), [latest?.deviceTypes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-sm text-gray-600">Latest website performance snapshot.</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {latest ? `Updated ${formatDate(latest.date)}` : 'No data yet'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Page Views</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isLoading ? '—' : latest?.pageViews ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isLoading ? '—' : latest?.uniqueVisitors ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isLoading ? '—' : formatPercent(latest?.bounceRate ?? null)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isLoading ? '—' : formatPercent(latest?.conversionRate ?? null)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most viewed content for the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-sm text-gray-500">No page data recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topPages.map((page) => (
                  <li key={page} className="flex items-center justify-between">
                    <span className="text-gray-700">{page}</span>
                    <Badge variant="secondary">Top page</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Mix</CardTitle>
            <CardDescription>Top sources & devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-2">Sources</p>
              {trafficSources.length === 0 ? (
                <p className="text-gray-500">No data yet.</p>
              ) : (
                <ul className="space-y-1">
                  {trafficSources.map(([source, value]) => (
                    <li key={source} className="flex items-center justify-between">
                      <span className="text-gray-600">{source}</span>
                      <span className="font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-2">Devices</p>
              {deviceTypes.length === 0 ? (
                <p className="text-gray-500">No data yet.</p>
              ) : (
                <ul className="space-y-1">
                  {deviceTypes.map(([device, value]) => (
                    <li key={device} className="flex items-center justify-between">
                      <span className="text-gray-600">{device}</span>
                      <span className="font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CustomersPanel() {
  const { data, isLoading } = useQuery<CustomerResponse>({
    queryKey: ['/api/admin/customers'],
    queryFn: () => authenticatedFetch('/api/admin/customers?limit=10'),
    enabled: isAuthenticated(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-sm text-gray-600">Connected customer list across Housecall Pro and the local database.</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {data ? `${data.total} total` : 'Loading'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
          <CardDescription>
            Source: {data?.source === 'housecall_pro' ? 'Housecall Pro' : 'Internal database'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.customers || []).map((customer) => (
                <TableRow key={`${customer.source}-${customer.id}`}>
                  <TableCell className="font-medium">{customer.firstName} {customer.lastName}</TableCell>
                  <TableCell>{customer.email || '—'}</TableCell>
                  <TableCell>{customer.phone || '—'}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{customer.source.replace('_', ' ')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.customers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading customers…' : 'No customers found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function TasksPanel() {
  const { data, isLoading } = useQuery<TaskRecord[]>({
    queryKey: ['/api/admin/tasks'],
    queryFn: () => authenticatedFetch('/api/admin/tasks'),
    enabled: isAuthenticated(),
  });

  const latestTasks = (data || []).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-sm text-gray-600">Track operational tasks assigned across teams.</p>
        </div>
        <Badge variant="outline" className="text-xs">{data?.length ?? 0} tasks</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Tasks</CardTitle>
          <CardDescription>Showing the most recent updates from the task queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge className={cn('capitalize', task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.priority || '—'}</TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell>{formatDate(task.createdAt)}</TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading tasks…' : 'No tasks available.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AIAgentPanel() {
  const { data, isLoading } = useQuery<AiChatSession[]>({
    queryKey: ['/api/admin/ai/sessions'],
    queryFn: () => authenticatedFetch('/api/admin/ai/sessions'),
    enabled: isAuthenticated(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Agent Assistant</h2>
          <p className="text-sm text-gray-600">Recent AI chat sessions tied to admin users.</p>
        </div>
        <Badge variant="outline" className="text-xs">{data?.length ?? 0} sessions</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Conversation threads are synced from the AI chat database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(data || []).slice(0, 6).map((session) => (
            <div key={session.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{session.title}</p>
                <Badge variant="secondary">{formatDateTime(session.updatedAt)}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {session.context ? session.context.slice(0, 140) : 'No context recorded.'}
              </p>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <p className="text-sm text-gray-500">{isLoading ? 'Loading sessions…' : 'No AI sessions found.'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function BlogPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      status: 'draft',
      excerpt: '',
      content: '',
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      author: '',
      category: '',
      tags: '',
      keywords: '',
      publishDate: '',
    },
  });

  const { data, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/v1/blog/posts'],
    queryFn: () => authenticatedFetch('/api/v1/blog/posts?limit=20'),
    enabled: isAuthenticated(),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BlogFormValues) => {
      const payload = {
        title: values.title,
        slug: values.slug,
        status: values.status,
        excerpt: values.excerpt || null,
        content: values.content,
        featuredImage: values.featuredImage || null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        author: values.author || null,
        category: values.category || null,
        tags: toDelimitedList(values.tags) || null,
        publishDate: toIsoString(values.publishDate),
      };

      if (editingPost) {
        return authenticatedFetch(`/api/v1/blog/posts/${editingPost.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      return authenticatedFetch('/api/v1/blog/posts', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          keywords: toDelimitedList(values.keywords) || [],
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: editingPost ? 'Blog post updated' : 'Blog post created',
        description: 'Your changes have been saved.',
      });
      setDialogOpen(false);
      setEditingPost(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/v1/blog/posts'] });
    },
    onError: (error) => {
      toast({
        title: 'Unable to save blog post',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) =>
      authenticatedFetch(`/api/v1/blog/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: 'Blog post deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/blog/posts'] });
    },
    onError: (error) => {
      toast({
        title: 'Unable to delete blog post',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const openForCreate = () => {
    setEditingPost(null);
    form.reset({
      title: '',
      slug: '',
      status: 'draft',
      excerpt: '',
      content: '',
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      author: '',
      category: '',
      tags: '',
      keywords: '',
      publishDate: '',
    });
    setDialogOpen(true);
  };

  const openForEdit = (post: BlogPost) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      slug: post.slug,
      status: post.status as BlogFormValues['status'],
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      featuredImage: post.featuredImage ?? '',
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? '',
      author: post.author ?? '',
      category: post.category ?? '',
      tags: post.tags?.join(', ') ?? '',
      keywords: '',
      publishDate: toLocalInputValue(post.publishDate),
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-sm text-gray-600">Latest content published across the website.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{data?.length ?? 0} posts</Badge>
          <Button size="sm" onClick={openForCreate} data-testid="button-new-blog-post">
            New Post
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Manage content directly from the admin portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Publish Date</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'capitalize',
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : post.status === 'review'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.publishDate)}</TableCell>
                  <TableCell>{formatDate(post.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openForEdit(post)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(post.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading posts…' : 'No blog posts found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingPost(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Blog Post' : 'Create Blog Post'}</DialogTitle>
            <DialogDescription>
              Add or update blog content that will appear on the public site.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Post title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="example-post-slug" {...field} />
                      </FormControl>
                      <FormDescription>Lowercase letters, numbers, and hyphens only.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('slug', slugify(form.getValues('title')))}
                  >
                    Generate from title
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publishDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publish Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank for drafts.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Johnson Bros. Plumbing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="maintenance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="winter, plumbing, tips" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="frozen pipes, quincy plumber" {...field} />
                      </FormControl>
                      <FormDescription>Used to track SEO keywords (applied on new posts).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Short summary for previews" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea rows={10} placeholder="Write the full post in Markdown..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Meta title for search results" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="SEO description for search results" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function GoogleAdsPanel() {
  const { data, isLoading } = useQuery<GoogleAdsCampaign[]>({
    queryKey: ['/api/admin/google-ads/campaigns'],
    queryFn: () => authenticatedFetch('/api/admin/google-ads/campaigns'),
    enabled: isAuthenticated(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Google Ads Management</h2>
          <p className="text-sm text-gray-600">Campaign performance synced from marketing integrations.</p>
        </div>
        <Badge variant="outline" className="text-xs">{data?.length ?? 0} campaigns</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Overview</CardTitle>
          <CardDescription>Latest campaign status and performance totals.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Conversions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                  <TableCell>
                    <Badge className={cn('capitalize', campaign.status === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(campaign.budget ?? null)}</TableCell>
                  <TableCell>{campaign.clicks ?? 0}</TableCell>
                  <TableCell>{formatCurrency(campaign.cost ?? null)}</TableCell>
                  <TableCell>{campaign.conversions ?? 0}</TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading campaigns…' : 'No campaigns synced yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function WebhooksPanel() {
  const { data, isLoading } = useQuery<WebhookEvent[]>({
    queryKey: ['/api/admin/webhooks/events'],
    queryFn: () => authenticatedFetch('/api/admin/webhooks/events?limit=10'),
    enabled: isAuthenticated(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhook Monitor</h2>
          <p className="text-sm text-gray-600">Recent webhook ingestion and processing statuses.</p>
        </div>
        <Badge variant="outline" className="text-xs">{data?.length ?? 0} events</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhooks</CardTitle>
          <CardDescription>Events processed from Housecall Pro and internal services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.eventType}</TableCell>
                  <TableCell>{event.eventCategory}</TableCell>
                  <TableCell>
                    <Badge className={cn('capitalize', event.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(event.receivedAt)}</TableCell>
                  <TableCell>{event.error || '—'}</TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading events…' : 'No webhook activity found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsPanel() {
  const user = getAdminUser();
  const { toast } = useToast();

  const { data: authData } = useQuery<AuthMeResponse>({
    queryKey: ['/api/admin/auth/me'],
    queryFn: () => authenticatedFetch('/api/admin/auth/me'),
    enabled: isAuthenticated(),
  });

  const { data: activityLogs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/admin/activity-logs'],
    queryFn: () => authenticatedFetch('/api/admin/activity-logs?limit=8'),
    enabled: isAuthenticated(),
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const webhookUrls = {
    sms: `${baseUrl}/api/v1/twilio/sms`,
    voice: `${baseUrl}/api/v1/twilio/voice`,
    voiceRealtime: `${baseUrl}/api/v1/twilio/voice/realtime`,
    voiceStatus: `${baseUrl}/api/v1/twilio/voice/status`,
    mcp: `${baseUrl}/mcp`,
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied!', description: `${label} URL copied to clipboard` });
    }).catch(() => {
      toast({ title: 'Copy failed', description: 'Please copy manually', variant: 'destructive' });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-600">Admin access details, webhook URLs, and recent system activity.</p>
        </div>
        <Badge variant="outline" className="text-xs">{user?.role ?? '—'}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Twilio Webhook URLs</CardTitle>
          <CardDescription>Copy these URLs into your Twilio console for SMS and Voice configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium text-gray-700">SMS Webhook</p>
                <p className="text-xs text-gray-500 truncate">{webhookUrls.sms}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrls.sms, 'SMS Webhook')}>
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium text-gray-700">Voice Webhook</p>
                <p className="text-xs text-gray-500 truncate">{webhookUrls.voice}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrls.voice, 'Voice Webhook')}>
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium text-gray-700">Voice Realtime (Media Streams)</p>
                <p className="text-xs text-gray-500 truncate">{webhookUrls.voiceRealtime}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrls.voiceRealtime, 'Voice Realtime')}>
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium text-gray-700">Voice Status Callback</p>
                <p className="text-xs text-gray-500 truncate">{webhookUrls.voiceStatus}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrls.voiceStatus, 'Voice Status')}>
                Copy
              </Button>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              Configure these in Twilio Console → Phone Numbers → Your Number → Messaging/Voice Configuration
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MCP Server Endpoint</CardTitle>
          <CardDescription>Public endpoint for AI assistants (ChatGPT, Claude) to access booking tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium text-blue-700">MCP Server URL</p>
              <p className="text-xs text-blue-600 truncate">{webhookUrls.mcp}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrls.mcp, 'MCP Server')}>
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
            <CardDescription>Current signed-in user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-medium">{user ? `${user.firstName} ${user.lastName}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium">{user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Role</span>
              <Badge variant="secondary" className="capitalize">{user?.role ?? '—'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Granted access for this account.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(authData?.permissions || []).length === 0 && (
              <p className="text-sm text-gray-500">Permissions not loaded.</p>
            )}
            {(authData?.permissions || []).map((permission) => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest admin actions tracked in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activityLogs || []).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.entityType ? `${log.entityType} ${log.entityId ?? ''}` : '—'}</TableCell>
                  <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                </TableRow>
              ))}
              {(!activityLogs || activityLogs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading activity…' : 'No activity yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
