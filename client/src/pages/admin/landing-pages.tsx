import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  RefreshCw,
  Filter,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import {
  LANDING_PAGES,
  getActiveLandingPages,
  getABTestingPages,
  getTotalMonthlyBudget,
  type LandingPageEntry,
} from "@/config/landingPages";

// Mock analytics data - in production this would come from your analytics API
function useLandingPageAnalytics(pageId: string, dateRange: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: ['/api/admin/landing-page-analytics', pageId, dateRange],
    queryFn: async () => {
      // In production, fetch from your analytics endpoint
      // For now, return mock data
      return {
        pageViews: Math.floor(Math.random() * 5000) + 500,
        uniqueVisitors: Math.floor(Math.random() * 3000) + 300,
        conversions: Math.floor(Math.random() * 100) + 10,
        conversionRate: (Math.random() * 10 + 2).toFixed(2),
        avgTimeOnPage: Math.floor(Math.random() * 180) + 30,
        bounceRate: (Math.random() * 40 + 20).toFixed(1),
        ctaClicks: Math.floor(Math.random() * 500) + 50,
        scrollDepth75: Math.floor(Math.random() * 60) + 20,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

function StatusBadge({ status }: { status: LandingPageEntry['status'] }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    draft: 'secondary',
    paused: 'outline',
    archived: 'destructive',
  };

  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paused: 'bg-gray-100 text-gray-800 border-gray-200',
    archived: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function SourceBadge({ source }: { source: LandingPageEntry['sources'][0] }) {
  const colors: Record<string, string> = {
    'google-ads': 'bg-blue-100 text-blue-800',
    'meta-ads': 'bg-indigo-100 text-indigo-800',
    'organic': 'bg-green-100 text-green-800',
    'direct': 'bg-gray-100 text-gray-800',
    'email': 'bg-purple-100 text-purple-800',
    'referral': 'bg-orange-100 text-orange-800',
  };

  return (
    <Badge variant="outline" className={colors[source.type]}>
      {source.type}
      {source.monthlyBudget && ` ($${source.monthlyBudget})`}
    </Badge>
  );
}

function LandingPageRow({
  page,
  dateRange,
}: {
  page: LandingPageEntry;
  dateRange: '7d' | '30d' | '90d';
}) {
  const { data: analytics, isLoading } = useLandingPageAnalytics(page.id, dateRange);

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{page.name}</span>
          <span className="text-xs text-muted-foreground">{page.path}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={page.status} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {page.sources.slice(0, 2).map((source, idx) => (
            <SourceBadge key={idx} source={source} />
          ))}
          {page.sources.length > 2 && (
            <Badge variant="outline">+{page.sources.length - 2}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {isLoading ? (
          <span className="text-muted-foreground">...</span>
        ) : (
          analytics?.pageViews.toLocaleString()
        )}
      </TableCell>
      <TableCell className="text-right">
        {isLoading ? (
          <span className="text-muted-foreground">...</span>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <span>{analytics?.conversionRate}%</span>
            {Number(analytics?.conversionRate) > (page.expectedConversionRate || 5) ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isLoading ? (
          <span className="text-muted-foreground">...</span>
        ) : (
          analytics?.conversions
        )}
      </TableCell>
      <TableCell>
        {page.abTest ? (
          <Badge variant="outline" className="bg-purple-50">
            {page.abTest.variant} - {page.abTest.testId}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => window.open(page.path, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Page
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Target className="h-4 w-4 mr-2" />
              View Analytics
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Calendar className="h-4 w-4 mr-2" />
              Edit Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function LandingPagesAdmin() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activePagesCount = getActiveLandingPages().length;
  const abTestingCount = getABTestingPages().length;
  const totalBudget = getTotalMonthlyBudget();

  const filteredPages = LANDING_PAGES.filter(
    page => statusFilter === 'all' || page.status === statusFilter
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">
            Track and optimize your landing page performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Landing Pages"
          value={LANDING_PAGES.length}
          subtitle={`${activePagesCount} active`}
          icon={Target}
        />
        <SummaryCard
          title="Monthly Ad Budget"
          value={`$${totalBudget.toLocaleString()}`}
          subtitle="Across all campaigns"
          icon={DollarSign}
        />
        <SummaryCard
          title="Active A/B Tests"
          value={abTestingCount}
          subtitle="Running experiments"
          icon={Filter}
          trend="up"
        />
        <SummaryCard
          title="Avg. Conversion Rate"
          value="5.2%"
          subtitle="Last 30 days"
          icon={MousePointer}
          trend="up"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter('all')}>
              All Pages ({LANDING_PAGES.length})
            </TabsTrigger>
            <TabsTrigger value="active" onClick={() => setStatusFilter('active')}>
              Active ({getActiveLandingPages().length})
            </TabsTrigger>
            <TabsTrigger value="testing" onClick={() => setStatusFilter('all')}>
              A/B Testing ({abTestingCount})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Date range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Landing Pages</CardTitle>
              <CardDescription>
                Complete list of landing pages with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Traffic Sources</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead>A/B Test</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <LandingPageRow
                      key={page.id}
                      page={page}
                      dateRange={dateRange}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Landing Pages</CardTitle>
              <CardDescription>
                Currently live pages receiving traffic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Traffic Sources</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead>A/B Test</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getActiveLandingPages().map((page) => (
                    <LandingPageRow
                      key={page.id}
                      page={page}
                      dateRange={dateRange}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing</CardTitle>
              <CardDescription>
                Pages with active experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Test ID</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getABTestingPages().map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{page.name}</span>
                          <span className="text-xs text-muted-foreground">{page.path}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {page.abTest?.testId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{page.abTest?.variant}</Badge>
                      </TableCell>
                      <TableCell>
                        {page.abTest?.startDate && format(new Date(page.abTest.startDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600">5.8%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        47
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/heatmap" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Heatmaps
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/experiments" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Manage A/B Tests
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/api-usage" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                View Costs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Registry</CardTitle>
          <CardDescription>
            Configuration file location: <code className="bg-gray-100 px-2 py-1 rounded text-xs">client/src/config/landingPages.ts</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            All landing pages are registered in the configuration file. To add a new landing page:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Create the landing page component using <code>LandingPageBuilder</code></li>
            <li>Add the page entry to <code>LANDING_PAGES</code> array in the config</li>
            <li>Add the route in <code>App.tsx</code></li>
            <li>Update sitemap if needed</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
