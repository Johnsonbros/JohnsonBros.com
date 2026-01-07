import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Users, FileText, Settings, LogOut, 
  Home, DollarSign, CheckCircle,
  Clock, Activity, Brain, Target, Bell, ListTodo, Menu, X, RefreshCw,
  Loader2, Zap
} from 'lucide-react';
import { authenticatedFetch, logout, getAdminUser, isAuthenticated } from '@/lib/auth';
import { cn } from '@/lib/utils';
import OperationsDashboard from './operations';
import CustomizableDashboard from './customizable-dashboard';
import {
  AnalyticsPanel,
  CustomersPanel,
  TasksPanel,
  AIAgentPanel,
  BlogPanel,
  GoogleAdsPanel,
  WebhooksPanel,
  SettingsPanel,
} from './dashboard-panels';

interface DashboardStats {
  today: {
    revenue: number;
    jobsCompleted: number;
    jobsInProgress: number;
    jobsScheduled: number;
    newCustomers: number;
    estimatesSent: number;
  };
  week: {
    revenue: number;
    jobsCompleted: number;
    newCustomers: number;
  };
  month: {
    revenue: number;
    jobsCompleted: number;
  };
  tasks: {
    pending: number;
  };
  events: {
    total: number;
    failed: number;
  };
  customers: {
    total: number;
    recentCount: number;
  };
  blog: {
    total: number;
    published: number;
  };
  realTimeData: {
    lastUpdated: string;
    source: string;
  };
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const user = getAdminUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, refetch, isRefetching } = useQuery<DashboardStats>({
    queryKey: ['/api/v1/admin/dashboard/stats'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/stats'),
    enabled: isAuthenticated(),
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (!user) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'operations', label: 'Operations', icon: Zap },
    { id: 'customizable', label: 'Customizable', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'ai-agent', label: 'AI Agent', icon: Brain },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'google-ads', label: 'Google Ads', icon: Target },
    { id: 'webhooks', label: 'Webhooks', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
              data-testid="button-menu-toggle"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-900" />
            <div className="text-sm text-gray-700">
              {user.firstName} {user.lastName} ({user.role})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-gray-200 h-[calc(100vh-60px)] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}>
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-johnson-orange/10 text-johnson-orange"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                data-testid={`button-nav-${item.id}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                  <div className="flex items-center space-x-2">
                    {stats?.realTimeData && (
                      <span className="text-xs text-gray-500">
                        Last updated: {new Date(stats.realTimeData.lastUpdated).toLocaleTimeString()}
                      </span>
                    )}
                    <Button
                      onClick={() => refetch()}
                      size="sm"
                      variant="outline"
                      disabled={isRefetching}
                      data-testid="button-refresh-stats"
                    >
                      {isRefetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </div>
                </div>
                
                {/* Real-time indicator */}
                {stats?.realTimeData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-700">
                        Live data from HousecallPro API
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold" data-testid="text-revenue-today">
                          {statsLoading ? '--' : formatCurrency(stats?.today.revenue || 0)}
                        </p>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Jobs Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-jobs-today">
                              {statsLoading ? '--' : stats?.today.jobsCompleted || 0}
                            </p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                        {stats && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <p className="text-sm font-medium text-orange-600">{stats.today.jobsInProgress}</p>
                              <p className="text-xs text-gray-500">In Progress</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">{stats.today.jobsScheduled}</p>
                              <p className="text-xs text-gray-500">Scheduled</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">New Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold" data-testid="text-customers-today">
                          {statsLoading ? '--' : stats?.today.newCustomers || 0}
                        </p>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold" data-testid="text-tasks-pending">
                          {statsLoading ? '--' : stats?.tasks.pending || 0}
                        </p>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Week & Month Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                    <CardDescription>Key metrics for different time periods</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">This Week</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="text-2xl font-bold text-green-600" data-testid="text-revenue-week">
                              {statsLoading ? '--' : formatCurrency(stats?.week.revenue || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Jobs Completed</p>
                            <p className="text-2xl font-bold text-blue-600" data-testid="text-jobs-week">
                              {statsLoading ? '--' : stats?.week.jobsCompleted || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">New Customers</p>
                            <p className="text-2xl font-bold text-purple-600" data-testid="text-customers-week">
                              {statsLoading ? '--' : stats?.week.newCustomers || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      {stats?.month && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium text-gray-700 mb-3">This Month</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-gray-600">Revenue</p>
                              <p className="text-2xl font-bold text-green-600" data-testid="text-revenue-month">
                                {formatCurrency(stats.month.revenue || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Jobs Completed</p>
                              <p className="text-2xl font-bold text-blue-600" data-testid="text-jobs-month">
                                {stats.month.jobsCompleted || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Webhook Events</span>
                        <Activity className="h-5 w-5 text-gray-400" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Events Today</span>
                          <span className="font-medium" data-testid="text-events-total">
                            {statsLoading ? '--' : stats?.events.total || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Failed Events</span>
                          <span className="font-medium text-red-600" data-testid="text-events-failed">
                            {statsLoading ? '--' : stats?.events.failed || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="font-medium text-green-600">
                            {statsLoading ? '--' : 
                              stats?.events.total ? 
                                `${Math.round(((stats.events.total - stats.events.failed) / stats.events.total) * 100)}%` 
                                : '100%'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Content & Customers</span>
                        <FileText className="h-5 w-5 text-gray-400" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Customers</span>
                          <span className="font-medium" data-testid="text-customers-total">
                            {statsLoading ? '--' : stats?.customers.total || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Recent Customers</span>
                          <span className="font-medium" data-testid="text-customers-recent">
                            {statsLoading ? '--' : stats?.customers.recentCount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Blog Posts</span>
                          <span className="font-medium" data-testid="text-blog-total">
                            {statsLoading ? '--' : stats?.blog.total || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Published Posts</span>
                          <span className="font-medium text-green-600" data-testid="text-blog-published">
                            {statsLoading ? '--' : stats?.blog.published || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operations">
              <OperationsDashboard />
            </TabsContent>

            <TabsContent value="customizable">
              <CustomizableDashboard />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsPanel />
            </TabsContent>

            <TabsContent value="customers">
              <CustomersPanel />
            </TabsContent>

            <TabsContent value="tasks">
              <TasksPanel />
            </TabsContent>

            <TabsContent value="ai-agent">
              <AIAgentPanel />
            </TabsContent>

            <TabsContent value="blog">
              <BlogPanel />
            </TabsContent>

            <TabsContent value="google-ads">
              <GoogleAdsPanel />
            </TabsContent>

            <TabsContent value="webhooks">
              <WebhooksPanel />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
