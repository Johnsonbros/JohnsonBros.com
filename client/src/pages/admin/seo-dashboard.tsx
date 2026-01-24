import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Globe,
  ArrowUpRight,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  useSeoMetricsSummary,
  useSeoMetricsHistory,
  useCrawlErrors,
  useSearchAnalytics,
  useSeoAlerts,
  useRequestIndexing,
  useDismissAlert,
  useSyncData,
} from './seo-dashboard.hooks';

// Migration date for reference line on charts
const MIGRATION_DATE = '2026-01-15';

export default function SeoDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsType, setAnalyticsType] = useState<'queries' | 'pages'>('queries');
  const [crawlErrorsPage, setCrawlErrorsPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);

  // Date calculations
  const getDates = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { startDate, endDate } = getDates();

  // Data fetching
  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useSeoMetricsSummary();
  const { data: historyData, isLoading: historyLoading } = useSeoMetricsHistory(startDate, endDate);
  const { data: crawlErrorsData, isLoading: crawlErrorsLoading } = useCrawlErrors(crawlErrorsPage);
  const { data: analyticsData, isLoading: analyticsLoading } = useSearchAnalytics(startDate, endDate, analyticsType);
  const { data: alertsData, isLoading: alertsLoading } = useSeoAlerts(alertsPage);

  // Mutations
  const requestIndexing = useRequestIndexing();
  const dismissAlert = useDismissAlert();
  const syncData = useSyncData();

  const summary = summaryData?.data;
  const metrics = historyData?.data?.metrics || [];
  const crawlErrors = crawlErrorsData?.data;
  const analyticsItems = analyticsData?.data?.items || [];
  const alerts = alertsData?.data?.alerts || [];
  const alertsPagination = alertsData?.data?.pagination;

  // Helpers
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const formatPercent = (num: number) => `${(num * 100).toFixed(2)}%`;
  const formatPosition = (num: number) => num.toFixed(1);

  const getTrendIcon = (current: number | null, previous: number | null, isLowerBetter = false) => {
    if (current === null || previous === null) return null;
    const isUp = current > previous;
    const isGood = isLowerBetter ? !isUp : isUp;
    return isGood ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'error':
        return 'bg-orange-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleSync = async () => {
    await syncData.mutateAsync();
    refetchSummary();
  };

  const handleRequestIndexing = async (url: string) => {
    await requestIndexing.mutateAsync({ urls: [url] });
  };

  const handleDismissAlert = async (alertId: string) => {
    await dismissAlert.mutateAsync({ alertId });
  };

  const isLoading = summaryLoading || historyLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SEO Migration Monitor</h1>
          <p className="text-muted-foreground">
            Track indexing status, crawl errors, and ranking changes
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {summary?.lastUpdated && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last synced: {new Date(summary.lastUpdated).toLocaleString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncData.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncData.isPending ? 'animate-spin' : ''}`} />
            {syncData.isPending ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        <Button
          variant={dateRange === '7d' ? 'default' : 'outline'}
          onClick={() => setDateRange('7d')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={dateRange === '30d' ? 'default' : 'outline'}
          onClick={() => setDateRange('30d')}
        >
          Last 30 Days
        </Button>
        <Button
          variant={dateRange === '90d' ? 'default' : 'outline'}
          onClick={() => setDateRange('90d')}
        >
          Last 90 Days
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Indexed Pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Indexed Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {summaryLoading ? '...' : formatNumber(summary?.indexedPages || 0)}
              </span>
              {getTrendIcon(summary?.indexedPages || 0, summary?.previousIndexedPages || 0)}
            </div>
            {summary?.previousIndexedPages && summary.indexedPages !== summary.previousIndexedPages && (
              <p className="text-xs text-muted-foreground mt-1">
                Previously: {formatNumber(summary.previousIndexedPages)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Crawl Errors */}
        <Card className={summary?.crawlErrors && summary.crawlErrors > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${summary?.crawlErrors ? 'text-red-500' : ''}`} />
              Crawl Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${summary?.crawlErrors ? 'text-red-600' : ''}`}>
                {summaryLoading ? '...' : formatNumber(summary?.crawlErrors || 0)}
              </span>
              {summary?.crawlErrors === 0 && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          </CardContent>
        </Card>

        {/* Organic Clicks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Organic Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {summaryLoading ? '...' : formatNumber(summary?.totalClicks || 0)}
            </span>
          </CardContent>
        </Card>

        {/* Average Position */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Avg Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${summary?.averagePosition && summary.averagePosition < 10 ? 'text-green-600' : ''}`}>
                {summaryLoading ? '...' : formatPosition(summary?.averagePosition || 0)}
              </span>
              {getTrendIcon(
                summary?.previousPosition || 0,
                summary?.averagePosition || 0,
                true
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Index Coverage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Index Coverage Over Time
          </CardTitle>
          <CardDescription>
            Tracking indexed pages during and after migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="h-64 flex items-center justify-center">Loading chart...</div>
          ) : metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [formatNumber(value), 'Indexed Pages']}
                />
                <ReferenceLine
                  x={MIGRATION_DATE}
                  stroke="#8884d8"
                  strokeDasharray="3 3"
                  label={{ value: 'Migration', position: 'top', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="indexedPages"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Indexed Pages"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No historical data available yet. Data will appear after the first sync.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crawl Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Crawl Errors
          </CardTitle>
          <CardDescription>URLs with indexing issues</CardDescription>
        </CardHeader>
        <CardContent>
          {crawlErrorsLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : crawlErrors?.errors && crawlErrors.errors.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Last Crawled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crawlErrors.errors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell className="font-mono text-xs max-w-[300px] truncate">
                        {error.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{error.errorType || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {error.lastCrawled
                          ? new Date(error.lastCrawled).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestIndexing(error.url)}
                          disabled={requestIndexing.isPending}
                        >
                          Request Indexing
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {crawlErrors.pagination && crawlErrors.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCrawlErrorsPage(p => Math.max(1, p - 1))}
                    disabled={crawlErrorsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {crawlErrorsPage} of {crawlErrors.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCrawlErrorsPage(p => Math.min(crawlErrors.pagination.totalPages, p + 1))}
                    disabled={crawlErrorsPage === crawlErrors.pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              No crawl errors detected
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Performance
          </CardTitle>
          <CardDescription>Top queries and pages from Google Search Console</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={analyticsType} onValueChange={(v) => setAnalyticsType(v as 'queries' | 'pages')}>
            <TabsList className="mb-4">
              <TabsTrigger value="queries">Top Queries</TabsTrigger>
              <TabsTrigger value="pages">Top Pages</TabsTrigger>
            </TabsList>
            <TabsContent value="queries">
              {analyticsLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : analyticsItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.query}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.impressions)}</TableCell>
                        <TableCell className="text-right">{formatPercent(item.ctr)}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.position < 10 ? 'text-green-600 font-medium' : ''}>
                            {formatPosition(item.position)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No query data available
                </div>
              )}
            </TabsContent>
            <TabsContent value="pages">
              {analyticsLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : analyticsItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs max-w-[300px] truncate">
                          {item.page}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.impressions)}</TableCell>
                        <TableCell className="text-right">{formatPercent(item.ctr)}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.position < 10 ? 'text-green-600 font-medium' : ''}>
                            {formatPosition(item.position)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No page data available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Active Alerts
            {summary?.activeAlerts ? (
              <Badge variant="secondary">{summary.activeAlerts}</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>SEO issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    )}
                    {alert.url && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {alert.url}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    disabled={dismissAlert.isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
              {alertsPagination && alertsPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAlertsPage(p => Math.max(1, p - 1))}
                    disabled={alertsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {alertsPage} of {alertsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAlertsPage(p => Math.min(alertsPagination.totalPages, p + 1))}
                    disabled={alertsPage === alertsPagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              No active alerts
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
