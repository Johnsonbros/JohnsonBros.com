import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Database,
  ExternalLink, HardDrive, Heart, MemoryStick, RefreshCw,
  Server, TrendingUp, Zap, XCircle
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Types
interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  type: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

interface ErrorSummary {
  totalErrors: number;
  errorRate: number;
  topErrors: {
    message: string;
    count: number;
    lastSeen: string;
  }[];
  errorTrend: {
    timestamp: string;
    count: number;
  }[];
}

interface PerformanceSummary {
  p50ResponseMs: number;
  p95ResponseMs: number;
  p99ResponseMs: number;
  avgResponseMs: number;
  slowestEndpoints: {
    endpoint: string;
    avgMs: number;
    p95Ms: number;
    requestCount: number;
  }[];
  requestVolume: {
    timestamp: string;
    count: number;
  }[];
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: {
    uptime: number;
    since: string;
    currentStatus: string;
    incidentCount: number;
  };
  memory: {
    usedMb: number;
    totalMb: number;
    usagePercent: number;
  };
  cpu: {
    usagePercent: number;
  };
  disk: {
    usedGb: number;
    totalGb: number;
    usagePercent: number;
  } | null;
  database: {
    status: 'connected' | 'disconnected';
    connectionPoolSize: number;
    activeConnections: number;
  };
  externalServices: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastResponseMs: number;
    lastCheck: string;
  }[];
}

interface DashboardOverview {
  health: SystemHealth;
  errors: ErrorSummary;
  performance: PerformanceSummary;
  alerts: Alert[];
  unacknowledgedAlertCount: number;
}

// Status indicators
const STATUS_COLORS = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  unhealthy: 'bg-red-500',
};

const STATUS_TEXT = {
  healthy: 'text-green-700',
  degraded: 'text-yellow-700',
  unhealthy: 'text-red-700',
};

const ALERT_COLORS = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

function StatusIndicator({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]} animate-pulse`} />
      <span className={`font-medium capitalize ${STATUS_TEXT[status]}`}>{status}</span>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function formatBytes(mb: number): string {
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function ObservabilityDashboard() {
  const [dateRange, setDateRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const queryClient = useQueryClient();

  const getHours = () => {
    switch (dateRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 168;
      default: return 24;
    }
  };

  // Fetch dashboard overview
  const { data: overview, isLoading, error, refetch } = useQuery<DashboardOverview>({
    queryKey: ['observability-overview', dateRange],
    queryFn: () => authenticatedFetch(`/api/admin/observability/overview?hours=${getHours()}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) =>
      authenticatedFetch(`/api/admin/observability/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability-overview'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to load observability data. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { health, errors, performance, alerts } = overview;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Observability</h1>
          <p className="text-muted-foreground">Monitor system health, performance, and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range)}
                className="rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Banner */}
      <Card className={health.status === 'healthy' ? 'border-green-200' : health.status === 'degraded' ? 'border-yellow-200' : 'border-red-200'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusIndicator status={health.status} />
              <div className="border-l pl-4">
                <div className="text-sm text-muted-foreground">Uptime</div>
                <div className="font-semibold">{health.uptime.uptime.toFixed(4)}%</div>
              </div>
              <div className="border-l pl-4">
                <div className="text-sm text-muted-foreground">Memory</div>
                <div className="font-semibold">{health.memory.usagePercent.toFixed(1)}%</div>
              </div>
              <div className="border-l pl-4">
                <div className="text-sm text-muted-foreground">Active Requests</div>
                <div className="font-semibold">{performance.requestVolume[performance.requestVolume.length - 1]?.count || 0}</div>
              </div>
            </div>
            {overview.unacknowledgedAlertCount > 0 && (
              <Badge variant="destructive">
                {overview.unacknowledgedAlertCount} unacknowledged alert{overview.unacknowledgedAlertCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Error Tracking
            </CardTitle>
            <CardDescription>
              {errors.totalErrors} errors in the last {getHours()}h ({(errors.errorRate * 100).toFixed(2)}% error rate)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={errors.errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleString()}
                    formatter={(value: number) => [value, 'Errors']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#f97316" fill="#fed7aa" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {errors.topErrors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Top Errors</h4>
                <div className="space-y-2">
                  {errors.topErrors.slice(0, 3).map((err, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 text-muted-foreground">{err.message}</span>
                      <Badge variant="secondary">{err.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Response Times
            </CardTitle>
            <CardDescription>
              P50: {formatDuration(performance.p50ResponseMs)} | P95: {formatDuration(performance.p95ResponseMs)} | P99: {formatDuration(performance.p99ResponseMs)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performance.requestVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleString()}
                    formatter={(value: number) => [value, 'Requests']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {performance.slowestEndpoints.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Slowest Endpoints</h4>
                <div className="space-y-2">
                  {performance.slowestEndpoints.slice(0, 3).map((endpoint, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 font-mono text-muted-foreground">{endpoint.endpoint}</span>
                      <Badge variant="outline">{formatDuration(endpoint.avgMs)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Last {alerts.length} alerts from the monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No alerts in the selected time range</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${ALERT_COLORS[alert.level]} ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={ALERT_COLORS[alert.level]}>
                            {alert.level}
                          </Badge>
                          <span className="font-medium">{alert.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                        {alert.acknowledged && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt!).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* External Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-purple-500" />
              External Services
            </CardTitle>
            <CardDescription>Status of integrated third-party services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.externalServices.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[service.status]}`} />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {service.lastResponseMs > 0 ? formatDuration(service.lastResponseMs) : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-500" />
              System Resources
            </CardTitle>
            <CardDescription>Server resource utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Memory */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(health.memory.usedMb)} / {formatBytes(health.memory.totalMb)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${health.memory.usagePercent > 85 ? 'bg-red-500' : health.memory.usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, health.memory.usagePercent)}%` }}
                  />
                </div>
              </div>

              {/* Disk (if available) */}
              {health.disk && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Disk</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {health.disk.usedGb.toFixed(1)} GB / {health.disk.totalGb.toFixed(1)} GB
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${health.disk.usagePercent > 90 ? 'bg-red-500' : health.disk.usagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, health.disk.usagePercent)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Database */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  {health.database.status === 'connected' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-muted-foreground capitalize">{health.database.status}</span>
                </div>
              </div>

              {/* Uptime */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Running Since</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(health.uptime.since).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentry Link */}
      {import.meta.env.VITE_SENTRY_DSN && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Detailed error tracking available in Sentry</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://sentry.io" target="_blank" rel="noopener noreferrer">
                  Open Sentry Dashboard
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
