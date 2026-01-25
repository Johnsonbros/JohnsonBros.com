import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Search,
  Globe,
  RefreshCw,
  ExternalLink,
  MapPin,
  Bell,
  BellRing,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Competitor {
  id: number;
  name: string;
  domain: string;
  website: string;
  city: string;
  type: string;
  isPriority: boolean;
  offersPlumbing: boolean;
  offersHeating: boolean;
  offersDrainCleaning: boolean;
  offersEmergency: boolean;
  notes: string;
}

interface Keyword {
  id: number;
  keyword: string;
  category: string;
  intent: string;
  isPrimary: boolean;
  targetUrl: string;
}

interface PeActivity {
  id: number;
  peCompany: string;
  activityType: string;
  targetCompany: string;
  targetLocation: string;
  summary: string;
  threatLevel: string;
  createdAt: string;
}

interface Alert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  summary: string;
  peCompany: string | null;
  sourceUrl: string | null;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: string;
}

interface AlertStats {
  unreadCount: number;
  criticalCount: number;
  recentAlerts: Alert[];
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface DashboardData {
  competitors: {
    total: number;
    priority: number;
    byType: { local: number; regional: number; national: number; pe_backed: number };
    list: Competitor[];
  };
  keywords: {
    total: number;
    rankings: Array<{ keyword: string; position: number | null; url: string | null }>;
    ranking1to3: number;
    ranking4to10: number;
    notRanking: number;
  };
  peActivity: {
    total: number;
    highThreat: number;
    recent: PeActivity[];
  };
}

export default function CompetitorTracking() {
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboard, isLoading, refetch } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['competitor-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/competitors/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
  });

  // Initialize mutation
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/competitors/initialize', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to initialize');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-dashboard'] });
    },
  });

  // Fetch all keywords
  const { data: keywordsData } = useQuery<{ success: boolean; data: Keyword[] }>({
    queryKey: ['competitor-keywords'],
    queryFn: async () => {
      const res = await fetch('/api/admin/competitors/keywords');
      if (!res.ok) throw new Error('Failed to fetch keywords');
      return res.json();
    },
  });

  // Fetch PE activity
  const { data: peData } = useQuery<{ success: boolean; data: PeActivity[] }>({
    queryKey: ['pe-activity'],
    queryFn: async () => {
      const res = await fetch('/api/admin/competitors/pe-activity');
      if (!res.ok) throw new Error('Failed to fetch PE activity');
      return res.json();
    },
  });

  // Fetch alerts
  const { data: alertsData, refetch: refetchAlerts } = useQuery<{ success: boolean; data: AlertStats }>({
    queryKey: ['competitor-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/competitors/alerts');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
  });

  // Mutations for alerts
  const createTestAlerts = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/competitors/alerts/test', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create test alerts');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-alerts'] });
    },
  });

  const markAlertRead = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await fetch(`/api/admin/competitors/alerts/${alertId}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark alert read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-alerts'] });
    },
  });

  const data = dashboard?.data;
  const keywords = keywordsData?.data || [];
  const peActivity = peData?.data || [];
  const alertStats = alertsData?.data;

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'local':
        return <Badge className="bg-green-600">Local</Badge>;
      case 'regional':
        return <Badge className="bg-blue-600">Regional</Badge>;
      case 'national':
        return <Badge className="bg-purple-600">National</Badge>;
      case 'pe_backed':
        return <Badge variant="destructive">PE-Backed</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      plumbing: 'bg-blue-600',
      drain: 'bg-amber-600',
      heating: 'bg-red-600',
      emergency: 'bg-red-800',
      location: 'bg-green-600',
    };
    return <Badge className={colors[category] || 'bg-gray-600'}>{category}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitor Tracking</h1>
          <p className="text-muted-foreground">
            Monitor competitors, keywords, and PE activity in the South Shore market
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => initializeMutation.mutate()} disabled={initializeMutation.isPending}>
            {initializeMutation.isPending ? 'Initializing...' : 'Initialize/Seed Data'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitors Tracked</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.competitors.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.competitors.priority || 0} priority targets
            </p>
          </CardContent>
        </Card>

        <Card className={alertStats?.unreadCount ? 'border-red-500 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            {alertStats?.unreadCount ? (
              <BellRing className="h-4 w-4 text-red-500 animate-pulse" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${alertStats?.unreadCount ? 'text-red-600' : ''}`}>
              {alertStats?.unreadCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {alertStats?.criticalCount || 0} critical in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Top 10</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(data?.keywords.ranking1to3 || 0) + (data?.keywords.ranking4to10 || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.keywords.ranking1to3 || 0} in top 3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PE Threat Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data?.peActivity.highThreat || 0} High
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.peActivity.total || 0} total activities tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="competitors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="pe-activity">PE Activity</TabsTrigger>
          <TabsTrigger value="alerts" className={alertStats?.unreadCount ? 'text-red-600' : ''}>
            Alerts {alertStats?.unreadCount ? `(${alertStats.unreadCount})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Competitors</CardTitle>
              <CardDescription>
                Local and regional competitors in the South Shore plumbing market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.competitors.list.map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {competitor.isPriority && (
                            <Target className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{competitor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {competitor.domain}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(competitor.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {competitor.city || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {competitor.offersPlumbing && <Badge variant="outline" className="text-xs">Plumbing</Badge>}
                          {competitor.offersHeating && <Badge variant="outline" className="text-xs">Heating</Badge>}
                          {competitor.offersDrainCleaning && <Badge variant="outline" className="text-xs">Drain</Badge>}
                          {competitor.offersEmergency && <Badge variant="outline" className="text-xs">24/7</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {competitor.notes}
                      </TableCell>
                      <TableCell>
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Primary Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-500" />
                  Primary Keywords
                </CardTitle>
                <CardDescription>
                  High-priority keywords we must rank #1 for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {keywords.filter(k => k.isPrimary).map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <div className="font-medium">{keyword.keyword}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getCategoryBadge(keyword.category)}
                          <span className="text-xs text-muted-foreground">
                            {keyword.targetUrl}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  South Shore Locations
                </CardTitle>
                <CardDescription>
                  Town and neighborhood-specific keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {keywords.filter(k => k.category === 'location').map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <div className="font-medium text-sm">{keyword.keyword}</div>
                        <div className="text-xs text-muted-foreground">
                          {keyword.targetUrl}
                        </div>
                      </div>
                      {keyword.isPrimary && (
                        <Badge variant="destructive" className="text-xs">Priority</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Keywords Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Tracked Keywords</CardTitle>
              <CardDescription>
                Complete list of keywords we're targeting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.slice(0, 30).map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>{getCategoryBadge(keyword.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{keyword.intent}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {keyword.targetUrl}
                      </TableCell>
                      <TableCell>
                        {keyword.isPrimary ? (
                          <Badge variant="destructive">Primary</Badge>
                        ) : (
                          <Badge variant="outline">Secondary</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {keywords.length > 30 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Showing 30 of {keywords.length} keywords
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PE Activity Tab */}
        <TabsContent value="pe-activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Private Equity Activity
              </CardTitle>
              <CardDescription>
                Track PE-backed companies entering the Boston/South Shore market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PE Company</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Threat Level</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.peCompany}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.activityType}</Badge>
                      </TableCell>
                      <TableCell>{activity.targetCompany || '-'}</TableCell>
                      <TableCell>{activity.targetLocation || '-'}</TableCell>
                      <TableCell>{getThreatBadge(activity.threatLevel)}</TableCell>
                      <TableCell className="max-w-[300px] text-sm text-muted-foreground">
                        {activity.summary}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* PE Threat Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">High Threat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">
                  <strong>Heritage Holding</strong> (Boston-based PE) acquired Winchester Mechanical in Aug 2024.
                  They are actively acquiring in our market.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Watch List</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700">
                  <strong>Wrench Group, Apex, Redwood</strong> are not in Boston yet but expanding rapidly.
                  Any acquisition announcement = immediate threat.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Our Advantage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700">
                  Family-owned since 1997. Local reputation. Google Maps presence in Quincy + Abington.
                  PE can't buy authenticity.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">PE Acquisition Alerts</h2>
              <p className="text-muted-foreground">
                Monitor private equity activity in the Massachusetts plumbing market
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => createTestAlerts.mutate()}
              disabled={createTestAlerts.isPending}
            >
              {createTestAlerts.isPending ? 'Creating...' : 'Create Test Alerts'}
            </Button>
          </div>

          {/* Alert Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={alertStats?.bySeverity.critical ? 'border-red-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alertStats?.bySeverity.critical || 0}</div>
              </CardContent>
            </Card>
            <Card className={alertStats?.bySeverity.high ? 'border-orange-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">High</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alertStats?.bySeverity.high || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Medium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alertStats?.bySeverity.medium || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Low</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alertStats?.bySeverity.low || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
              <CardDescription>
                PE acquisition alerts sorted by date. Critical alerts about South Shore require immediate attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertStats?.recentAlerts && alertStats.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {alertStats.recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${
                        !alert.isRead
                          ? alert.severity === 'critical'
                            ? 'border-red-500 bg-red-50'
                            : alert.severity === 'high'
                            ? 'border-orange-400 bg-orange-50'
                            : 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getThreatBadge(alert.severity)}
                            <Badge variant="outline">{alert.alertType.replace('_', ' ')}</Badge>
                            {!alert.isRead && (
                              <Badge className="bg-blue-600">New</Badge>
                            )}
                            {alert.isAcknowledged && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg">{alert.title}</h3>
                          <p className="text-muted-foreground mt-1">{alert.summary}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {alert.peCompany && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {alert.peCompany}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                            {alert.sourceUrl && (
                              <a
                                href={alert.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Source
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!alert.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAlertRead.mutate(alert.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts yet</p>
                  <p className="text-sm mt-2">
                    Click "Create Test Alerts" to see sample PE activity alerts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monitoring Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">How PE Monitoring Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>Automatic Detection:</strong> The system monitors news and press releases for PE activity
                in the Massachusetts plumbing/HVAC market.
              </p>
              <p>
                <strong>Severity Levels:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><span className="text-red-600 font-medium">Critical</span> - Activity in Quincy, Abington, Weymouth, Braintree, South Shore</li>
                <li><span className="text-orange-600 font-medium">High</span> - Activity anywhere in Massachusetts or Boston</li>
                <li><span className="text-yellow-600 font-medium">Medium</span> - Activity in New England region</li>
                <li><span className="text-gray-600 font-medium">Low</span> - General PE plumbing industry news</li>
              </ul>
              <p>
                <strong>PE Companies Monitored:</strong> Goldman Sachs (Sila), New Mountain Capital (GEM/HomeX),
                Wrench Group, Apex Service Partners, Redwood Services, Heritage Holding, and more.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
