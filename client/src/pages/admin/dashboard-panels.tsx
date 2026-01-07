import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { authenticatedFetch, getAdminUser, isAuthenticated } from '@/lib/auth';
import { cn } from '@/lib/utils';

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
  status: string;
  slug: string;
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
  const { data, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/v1/blog/posts'],
    queryFn: async () => {
      const response = await fetch('/api/v1/blog/posts?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-sm text-gray-600">Latest content published across the website.</p>
        </div>
        <Badge variant="outline" className="text-xs">{data?.length ?? 0} posts</Badge>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge className={cn('capitalize', post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.publishDate)}</TableCell>
                  <TableCell>{formatDate(post.updatedAt)}</TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                    {isLoading ? 'Loading posts…' : 'No blog posts found.'}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-600">Admin access details and recent system activity.</p>
        </div>
        <Badge variant="outline" className="text-xs">{user?.role ?? '—'}</Badge>
      </div>

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
