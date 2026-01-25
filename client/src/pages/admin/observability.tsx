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
    refetchInterval: 120000, // Refresh every 2 minutes
    refetchIntervalInBackground: false,
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
