import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Activity, CheckCircle, XCircle, Clock, TrendingUp, Users, DollarSign, FileText, ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { format } from 'date-fns';

interface WebhookEvent {
  id: number;
  eventId: string;
  eventType: string;
  eventCategory: string;
  entityId: string | null;
  status: string;
  receivedAt: string;
  processedAt: string | null;
  error: string | null;
}

interface WebhookAnalytics {
  date: string;
  eventCategory: string;
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  newCustomers: number;
  jobsCompleted: number;
  estimatesSent: number;
  invoicesCreated: number;
  totalRevenue: number;
  successRate: number;
}

interface ProcessedData {
  id: number;
  eventId: number;
  dataType: string;
  dataCategory: string;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number | null;
  serviceDate: string | null;
  serviceType: string | null;
  addressCity: string | null;
  isHighValue: boolean;
  isEmergency: boolean;
  tags: Array<{
    id: number;
    tagName: string;
    tagValue: string | null;
    tagCategory: string | null;
  }>;
}

interface WebhookConfig {
  webhookUrl: string;
  signatureVerification: 'enabled' | 'disabled';
  status: 'secured' | 'insecure';
  instructions: {
    setup: string[];
    headers: string[];
  };
}

export default function WebhookMonitor() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch webhook configuration
  const { data: config } = useQuery<WebhookConfig>({
    queryKey: ['/api/webhooks/config'],
    queryFn: async () => {
      const response = await fetch('/api/webhooks/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      return response.json();
    },
  });

  // Fetch webhook events
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<WebhookEvent[]>({
    queryKey: ['/api/webhooks/events', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all' 
        ? '/api/webhooks/events?limit=100'
        : `/api/webhooks/events?category=${selectedCategory}&limit=100`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  // Fetch webhook analytics
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery<WebhookAnalytics[]>({
    queryKey: ['/api/webhooks/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/webhooks/analytics?days=7');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Test webhook function
  const testWebhook = async (eventType: string) => {
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType })
      });
      
      if (!response.ok) throw new Error('Failed to send test webhook');
      
      await response.json();
      
      // Refetch events after test
      setTimeout(() => {
        refetchEvents();
      }, 1000);
    } catch (error) {
      console.error('Error sending test webhook:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    setRefreshing(false);
  };

  // Calculate summary stats
  const totalEvents = events.length;
  const processedEvents = events.filter(e => e.status === 'processed').length;
  const failedEvents = events.filter(e => e.status === 'failed').length;
  const pendingEvents = events.filter(e => e.status === 'pending').length;
  const successRate = totalEvents > 0 ? (processedEvents / totalEvents * 100).toFixed(1) : '0';

  // Calculate revenue from analytics
  const totalRevenue = analytics.reduce((sum, a) => sum + (a.totalRevenue || 0), 0);
  const totalNewCustomers = analytics.reduce((sum, a) => sum + (a.newCustomers || 0), 0);
  const totalJobsCompleted = analytics.reduce((sum, a) => sum + (a.jobsCompleted || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-500" data-testid="badge-processed">Processed</Badge>;
      case 'failed':
        return <Badge variant="destructive" data-testid="badge-failed">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary" data-testid="badge-pending">Pending</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'job':
        return <Activity className="h-4 w-4" />;
      case 'estimate':
        return <FileText className="h-4 w-4" />;
      case 'invoice':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Webhook Monitor</h2>
          <p className="text-muted-foreground">Monitor and analyze incoming Housecall Pro webhook events</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="gap-2"
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Status Alert */}
      {config && (
        <Alert className={config.status === 'secured' ? 'border-green-500' : 'border-yellow-500'}>
          <div className="flex items-center gap-2">
            {config.status === 'secured' ? (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-yellow-500" />
            )}
            <AlertTitle>
              Webhook Security Status: {config.status === 'secured' ? 'Secured' : 'Not Secured'}
            </AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            {config.status === 'secured' ? (
              <span className="text-green-600">
                ✓ Signature verification is enabled. All incoming webhooks will be verified using HMAC-SHA256.
              </span>
            ) : (
              <div className="space-y-2">
                <span className="text-yellow-600">
                  ⚠️ Signature verification is disabled. Set up the HOUSECALL_WEBHOOK_SECRET environment variable to enable webhook security.
                </span>
                <div className="mt-2 text-sm">
                  <strong>To enable signature verification:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Get your webhook signing secret from Housecall Pro</li>
                    <li>Add it to your environment variables as HOUSECALL_WEBHOOK_SECRET</li>
                    <li>Restart your server to apply the changes</li>
                  </ol>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-events">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">Last 100 events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-success-rate">{successRate}%</div>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">{processedEvents} processed</span>
              <span className="text-red-600">{failedEvents} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{totalJobsCompleted} jobs completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-new-customers">{totalNewCustomers}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="test" data-testid="tab-test">Test Webhooks</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Events</CardTitle>
              <CardDescription>View and filter incoming webhook events</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex gap-2 mb-4">
                {['all', 'customer', 'job', 'estimate', 'invoice', 'appointment', 'lead'].map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`button-filter-${category}`}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Events List */}
              <ScrollArea className="h-[500px] pr-4">
                {eventsLoading ? (
                  <div className="text-center py-8">Loading events...</div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No events found</div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(event.eventCategory)}
                            <span className="font-medium">{event.eventType}</span>
                            {getStatusBadge(event.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Event ID: {event.eventId || `internal-${event.id}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Received: {format(new Date(event.receivedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                          {event.error && (
                            <div className="text-xs text-red-600">Error: {event.error}</div>
                          )}
                        </div>
                        {event.status === 'pending' && (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        {event.status === 'processed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {event.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Analytics</CardTitle>
              <CardDescription>Performance metrics and business insights from webhook data</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">Loading analytics...</div>
              ) : analytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
              ) : (
                <div className="space-y-4">
                  {analytics.map((metric, index) => (
                    <div key={index} className="border rounded-lg p-4" data-testid={`analytics-${index}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold capitalize">{metric.eventCategory}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(metric.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {metric.successRate ? `${metric.successRate.toFixed(1)}%` : '0%'} Success
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Events</p>
                          <p className="font-medium">{metric.totalEvents}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">New Customers</p>
                          <p className="font-medium">{metric.newCustomers}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Jobs</p>
                          <p className="font-medium">{metric.jobsCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="font-medium">${metric.totalRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook Events</CardTitle>
              <CardDescription>Send test webhook events to verify the integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'customer.created',
                  'job.completed',
                  'estimate.sent',
                  'invoice.paid',
                  'appointment.scheduled',
                  'lead.created'
                ].map(eventType => (
                  <Button
                    key={eventType}
                    variant="outline"
                    onClick={() => testWebhook(eventType)}
                    data-testid={`button-test-${eventType}`}
                  >
                    Test {eventType}
                  </Button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">How to set up real webhooks:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Log in to your Housecall Pro account</li>
                  <li>Navigate to Settings → Integrations → Webhooks</li>
                  <li>Add your webhook URL: <code className="bg-background px-2 py-1 rounded">{config?.webhookUrl || 'https://yourdomain.com/api/webhooks/housecall'}</code></li>
                  <li>Copy the webhook signing secret provided by Housecall Pro</li>
                  <li>Add the secret to your environment as <code className="bg-background px-2 py-1 rounded">HOUSECALL_WEBHOOK_SECRET</code></li>
                  <li>Select the events you want to receive</li>
                  <li>Save and test the connection</li>
                </ol>
                
                {config?.status === 'insecure' && (
                  <Alert className="mt-4 border-yellow-500">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Security Note</AlertTitle>
                    <AlertDescription>
                      Signature verification is currently disabled. Make sure to configure the HOUSECALL_WEBHOOK_SECRET 
                      environment variable with the signing secret from Housecall Pro to secure your webhook endpoint.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}