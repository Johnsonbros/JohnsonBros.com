import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Activity, AlertCircle, CheckCircle, Clock, Database, 
  Globe, HardDrive, Cpu, TrendingUp, TrendingDown, 
  AlertTriangle, RefreshCw, Search, Download, Filter,
  BarChart3, Zap, Shield, Bug, Users, Server, 
  Wifi, WifiOff, Timer, Hash, Eye, Terminal
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { webVitalsMonitor } from "@/lib/monitoring/webVitals";
import { SEO } from "@/components/SEO";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    housecallpro: CheckResult;
    memory: CheckResult;
    environment: CheckResult;
  };
  version?: string;
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  details?: any;
}

interface ErrorMetric {
  timestamp: string;
  count: number;
  type: string;
  message?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

interface PerformanceMetric {
  timestamp: string;
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  percentile?: number;
}

interface APIMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestCount: number;
  successCount: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  context?: Record<string, any>;
}

export default function MonitoringDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [logLevel, setLogLevel] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [correlationId, setCorrelationId] = useState("");
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Fetch health status
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthCheck>({
    queryKey: ['/api/health'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch error metrics
  const { data: errorMetrics, refetch: refetchErrors } = useQuery<ErrorMetric[]>({
    queryKey: ['/api/v1/monitoring/errors', selectedTimeRange],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch performance metrics
  const { data: performanceData, refetch: refetchPerformance } = useQuery<PerformanceMetric[]>({
    queryKey: ['/api/v1/monitoring/performance', selectedTimeRange],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch API metrics
  const { data: apiMetrics, refetch: refetchAPI } = useQuery<APIMetric[]>({
    queryKey: ['/api/v1/monitoring/api-metrics', selectedTimeRange],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch logs
  const { data: logs, refetch: refetchLogs } = useQuery<LogEntry[]>({
    queryKey: ['/api/v1/monitoring/logs', { level: logLevel, search: logSearch, correlationId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (logLevel !== 'all') params.append('level', logLevel);
      if (logSearch) params.append('search', logSearch);
      if (correlationId) params.append('correlationId', correlationId);
      
      const response = await apiRequest('GET', `/api/v1/monitoring/logs?${params}`);
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Get Web Vitals from client
  const [webVitals, setWebVitals] = useState<any[]>([]);
  
  useEffect(() => {
    const metrics = webVitalsMonitor.getMetrics();
    setWebVitals(metrics);
    
    // Update Web Vitals every 10 seconds
    const interval = setInterval(() => {
      setWebVitals(webVitalsMonitor.getMetrics());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh all
  const refreshAll = () => {
    refetchHealth();
    refetchErrors();
    refetchPerformance();
    refetchAPI();
    refetchLogs();
    setWebVitals(webVitalsMonitor.getMetrics());
  };

  // Toggle debug mode
  const handleDebugModeToggle = async () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    
    await apiRequest('POST', '/api/v1/monitoring/debug-mode', { enabled: newMode });
  };

  // Export logs
  const exportLogs = async () => {
    const response = await apiRequest('GET', `/api/v1/monitoring/logs/export?timeRange=${selectedTimeRange}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    a.click();
  };

  // Clear logs (with confirmation)
  const clearOldLogs = async () => {
    if (!confirm('Are you sure you want to clear logs older than 7 days?')) return;
    
    await apiRequest('POST', '/api/v1/monitoring/logs/clear', { olderThan: '7d' });
    
    refetchLogs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-500';
      case 'degraded':
      case 'warn':
        return 'text-yellow-500';
      case 'unhealthy':
      case 'fail':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
      case 'fail':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const performanceScore = webVitalsMonitor.getPerformanceScore();

  return (
    <div className="min-h-screen bg-background" data-testid="monitoring-dashboard">
      <SEO
        title="System Monitoring | Admin"
        description="Real-time system monitoring and performance metrics"
      />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">System Monitoring</h1>
              <p className="text-muted-foreground">Real-time health, performance, and error tracking</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Time Range */}
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">Last 15m</SelectItem>
                  <SelectItem value="1h">Last 1h</SelectItem>
                  <SelectItem value="6h">Last 6h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7d</SelectItem>
                </SelectContent>
              </Select>

              {/* Auto Refresh */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  data-testid="switch-auto-refresh"
                />
                <Label>Auto-refresh</Label>
              </div>

              {/* Manual Refresh */}
              <Button onClick={refreshAll} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Health Status Overview */}
        {healthData && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>System Health</CardTitle>
                    {getStatusIcon(healthData.status)}
                    <Badge variant={healthData.status === 'healthy' ? 'default' : healthData.status === 'degraded' ? 'secondary' : 'destructive'}>
                      {healthData.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Uptime: {Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Database */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthData.checks.database.status)}
                      <span className={getStatusColor(healthData.checks.database.status)}>
                        {healthData.checks.database.message}
                      </span>
                    </div>
                    {healthData.checks.database.responseTime && (
                      <p className="text-xs text-muted-foreground">
                        Response: {healthData.checks.database.responseTime}ms
                      </p>
                    )}
                  </div>

                  {/* HousecallPro API */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">HousecallPro API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthData.checks.housecallpro.status)}
                      <span className={getStatusColor(healthData.checks.housecallpro.status)}>
                        {healthData.checks.housecallpro.message}
                      </span>
                    </div>
                    {healthData.checks.housecallpro.responseTime && (
                      <p className="text-xs text-muted-foreground">
                        Response: {healthData.checks.housecallpro.responseTime}ms
                      </p>
                    )}
                  </div>

                  {/* Memory */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="font-medium">Memory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthData.checks.memory.status)}
                      <span className={getStatusColor(healthData.checks.memory.status)}>
                        {healthData.checks.memory.message}
                      </span>
                    </div>
                    {healthData.checks.memory.details && (
                      <p className="text-xs text-muted-foreground">
                        Usage: {healthData.checks.memory.details.heapUsedMB}MB / {healthData.checks.memory.details.heapTotalMB}MB ({healthData.checks.memory.details.heapPercentage}%)
                      </p>
                    )}
                  </div>

                  {/* Environment */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Environment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthData.checks.environment.status)}
                      <span className={getStatusColor(healthData.checks.environment.status)}>
                        {healthData.checks.environment.message}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="api">API Metrics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            {/* Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle>Web Vitals</CardTitle>
                <CardDescription>Core Web Vitals and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Performance Score */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Performance Score</span>
                    <span className="text-2xl font-bold">{performanceScore}/100</span>
                  </div>
                  <Progress value={performanceScore} className="h-3" />
                </div>

                {/* Individual Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {webVitals.map((metric) => (
                    <div key={metric.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{metric.name}</span>
                        <Badge variant={
                          metric.rating === 'good' ? 'default' : 
                          metric.rating === 'needs-improvement' ? 'secondary' : 
                          'destructive'
                        }>
                          {metric.rating}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{metric.value}ms</p>
                      <p className="text-xs text-muted-foreground">
                        Delta: {metric.delta}ms
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* API Performance Chart */}
            {apiMetrics && apiMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>API Response Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={apiMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgResponseTime" fill="#8884d8" name="Avg Response (ms)" />
                      <Bar dataKey="p95ResponseTime" fill="#82ca9d" name="P95 (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Tracking</CardTitle>
                <CardDescription>Recent errors and error trends</CardDescription>
              </CardHeader>
              <CardContent>
                {errorMetrics && errorMetrics.length > 0 ? (
                  <div className="space-y-4">
                    {/* Error Chart */}
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={errorMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Error List */}
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {errorMetrics.map((error: ErrorMetric, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="destructive">{error.type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(error.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                            <p className="font-mono text-sm">{error.message}</p>
                            {error.url && (
                              <p className="text-xs text-muted-foreground mt-1">URL: {error.url}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No errors detected in the selected time range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Metrics Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoint Metrics</CardTitle>
                <CardDescription>Performance and reliability metrics for API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {apiMetrics && apiMetrics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Endpoint</th>
                          <th className="text-left py-2">Method</th>
                          <th className="text-right py-2">Requests</th>
                          <th className="text-right py-2">Success Rate</th>
                          <th className="text-right py-2">Avg Time</th>
                          <th className="text-right py-2">P95</th>
                          <th className="text-right py-2">P99</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiMetrics.map((metric: APIMetric, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 font-mono text-sm">{metric.endpoint}</td>
                            <td className="py-2">
                              <Badge variant="outline">{metric.method}</Badge>
                            </td>
                            <td className="text-right py-2">{metric.requestCount}</td>
                            <td className="text-right py-2">
                              <span className={metric.errorRate > 0.05 ? 'text-red-500' : 'text-green-500'}>
                                {((1 - metric.errorRate) * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right py-2">{metric.avgResponseTime}ms</td>
                            <td className="text-right py-2">{metric.p95ResponseTime}ms</td>
                            <td className="text-right py-2">{metric.p99ResponseTime}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No API metrics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Logs</CardTitle>
                <div className="flex items-center gap-4 mt-4">
                  {/* Log Level Filter */}
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  <div className="flex-1">
                    <Input
                      placeholder="Search logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Correlation ID */}
                  <Input
                    placeholder="Correlation ID"
                    value={correlationId}
                    onChange={(e) => setCorrelationId(e.target.value)}
                    className="w-48"
                  />

                  {/* Actions */}
                  <Button onClick={exportLogs} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={clearOldLogs} variant="outline" size="sm">
                    Clear Old
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {logs && logs.length > 0 ? (
                    <div className="space-y-2 font-mono text-sm">
                      {logs.map((log: LogEntry) => (
                        <div 
                          key={log.id}
                          className={`p-2 rounded border ${
                            log.level === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' :
                            log.level === 'warn' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20' :
                            log.level === 'debug' ? 'bg-gray-50 border-gray-200 dark:bg-gray-950/20' :
                            'bg-blue-50 border-blue-200 dark:bg-blue-950/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                log.level === 'error' ? 'destructive' :
                                log.level === 'warn' ? 'secondary' :
                                'outline'
                              }>
                                {log.level.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                              </span>
                              {log.requestId && (
                                <Badge variant="outline" className="text-xs">
                                  {log.requestId}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="break-all">{log.message}</p>
                          {log.context && Object.keys(log.context).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-muted-foreground">
                                Context
                              </summary>
                              <pre className="mt-1 text-xs overflow-x-auto">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No logs found</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Debug Tools</CardTitle>
                <CardDescription>Advanced debugging and monitoring tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Debug Mode Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Debug Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Enable verbose logging and detailed error messages
                    </p>
                  </div>
                  <Switch
                    checked={debugMode}
                    onCheckedChange={handleDebugModeToggle}
                    data-testid="switch-debug-mode"
                  />
                </div>

                {/* Current Configuration */}
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Current Configuration</p>
                  <div className="space-y-1 text-sm">
                    <p>Environment: {import.meta.env.MODE}</p>
                    <p>API Version: {healthData?.version || 'Unknown'}</p>
                    <p>Sentry: {import.meta.env.VITE_SENTRY_DSN ? 'Enabled' : 'Disabled'}</p>
                    <p>Analytics: {import.meta.env.VITE_GA_MEASUREMENT_ID ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                {/* Performance Budget Status */}
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Performance Budget Status</p>
                  <div className="space-y-2">
                    {webVitals.map((metric) => {
                      const budgets: Record<string, { good: number; poor: number }> = {
                        LCP: { good: 2500, poor: 4000 },
                        INP: { good: 200, poor: 500 },
                        CLS: { good: 0.1, poor: 0.25 },
                        FCP: { good: 1800, poor: 3000 },
                        TTFB: { good: 800, poor: 1800 },
                      };
                      const budget = budgets[metric.name];
                      
                      return budget ? (
                        <div key={metric.name} className="flex items-center justify-between">
                          <span className="text-sm">{metric.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{metric.value}ms</span>
                            {metric.value <= budget.good ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : metric.value <= budget.poor ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Test Endpoints */}
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Test Endpoints</p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => fetch('/api/health')}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      Test Health Check
                    </Button>
                    <Button
                      onClick={() => fetch('/api/health/ready')}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      Test Readiness
                    </Button>
                    <Button
                      onClick={() => fetch('/api/health/live')}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      Test Liveness
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}