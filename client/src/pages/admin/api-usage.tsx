import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, MessageSquare, Phone, Map,
  Calendar, RefreshCw, Download
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface UsageSummary {
  startDate: string;
  endDate: string;
  grandTotalCents: number;
  grandTotalDollars: number;
  byService: Array<{
    service: string;
    totalCostDollars: number;
    totalCostCents: number;
    totalUnits: number;
    requestCount: number;
  }>;
}

interface DailyUsage {
  startDate: string;
  endDate: string;
  daily: Array<{
    date: string;
    service: string;
    totalCostDollars: number;
    totalCostCents: number;
    requestCount: number;
  }>;
}

interface ChannelUsage {
  startDate: string;
  endDate: string;
  byChannel: Array<{
    channel: string;
    service: string;
    totalCostDollars: number;
    totalCostCents: number;
    totalUnits: number;
    requestCount: number;
  }>;
  channelTotals: Array<{
    channel: string;
    totalCostCents: number;
    totalCostDollars: number;
    requestCount: number;
  }>;
}

const SERVICE_COLORS = {
  openai: '#10b981',
  twilio: '#3b82f6',
  google_maps: '#f59e0b',
} as const;

const CHANNEL_COLORS = {
  web_chat: '#8b5cf6',
  sms: '#ec4899',
  voice: '#14b8a6',
  unknown: '#6b7280',
} as const;

export default function ApiUsageDashboard() {
  // ADMIN-TODO-004: DONE - Add exportable reports and a unified date-range picker.
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

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
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const { startDate, endDate } = getDates();

  // Fetch usage summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<UsageSummary>({
    queryKey: ['/api/admin/usage/summary', startDate, endDate],
    queryFn: () => authenticatedFetch(
      `/api/admin/usage/summary?startDate=${startDate}&endDate=${endDate}`
    ),
    staleTime: 60000, // 1 minute
  });

  // Fetch daily usage
  const { data: daily, isLoading: dailyLoading } = useQuery<DailyUsage>({
    queryKey: ['/api/admin/usage/daily', startDate, endDate],
    queryFn: () => authenticatedFetch(
      `/api/admin/usage/daily?startDate=${startDate}&endDate=${endDate}`
    ),
    staleTime: 60000,
  });

  // Fetch channel usage
  const { data: channel, isLoading: channelLoading } = useQuery<ChannelUsage>({
    queryKey: ['/api/admin/usage/by-channel', startDate, endDate],
    queryFn: () => authenticatedFetch(
      `/api/admin/usage/by-channel?startDate=${startDate}&endDate=${endDate}`
    ),
    staleTime: 60000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Transform daily data for the chart
  const dailyChartData = daily?.daily.reduce((acc: any[], item) => {
    const existingDate = acc.find(d => d.date === item.date);
    if (existingDate) {
      existingDate[item.service] = item.totalCostDollars;
    } else {
      acc.push({
        date: item.date,
        [item.service]: item.totalCostDollars,
      });
    }
    return acc;
  }, []) || [];

  // Get service icon
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'openai':
        return <DollarSign className="h-4 w-4" />;
      case 'twilio':
        return <MessageSquare className="h-4 w-4" />;
      case 'google_maps':
        return <Map className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'web_chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'voice':
        return <Phone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const isLoading = summaryLoading || dailyLoading || channelLoading;

  // Export report as CSV
  const exportReport = () => {
    if (!summary || !daily || !channel) return;

    const csvContent = [
      ['API Usage Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Period: ${startDate} to ${endDate}`],
      [''],
      ['SUMMARY'],
      ['Total Spend (USD)', summary.grandTotalDollars],
      ['Total Requests', summary.byService.reduce((sum, s) => sum + s.requestCount, 0)],
      [''],
      ['BREAKDOWN BY SERVICE'],
      ['Service', 'Cost (USD)', 'Requests', 'Units'],
      ...summary.byService.map(s => [
        s.service,
        s.totalCostDollars,
        s.requestCount,
        s.totalUnits
      ]),
      [''],
      ['BREAKDOWN BY CHANNEL'],
      ['Channel', 'Cost (USD)', 'Requests'],
      ...channel.channelTotals.map(c => [
        c.channel,
        c.totalCostDollars,
        c.requestCount
      ]),
    ];

    const csv = csvContent.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Usage & Spending</h1>
          <p className="text-muted-foreground">
            Track costs across OpenAI, Twilio, and Google Maps
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            disabled={isLoading || !summary}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSummary();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
          <CardDescription>
            {dateRange === '7d' && 'Last 7 days'}
            {dateRange === '30d' && 'Last 30 days'}
            {dateRange === '90d' && 'Last 90 days'} • {startDate.split('T')[0]} to {endDate.split('T')[0]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={dateRange === '7d' ? 'default' : 'outline'}
              onClick={() => setDateRange('7d')}
              size="sm"
            >
              Last 7 Days
            </Button>
            <Button
              variant={dateRange === '30d' ? 'default' : 'outline'}
              onClick={() => setDateRange('30d')}
              size="sm"
            >
              Last 30 Days
            </Button>
            <Button
              variant={dateRange === '90d' ? 'default' : 'outline'}
              onClick={() => setDateRange('90d')}
              size="sm"
            >
              Last 90 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Total Spend Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Estimated Spend
          </CardTitle>
          <CardDescription>
            {dateRange === '7d' && 'Last 7 days'}
            {dateRange === '30d' && 'Last 30 days'}
            {dateRange === '90d' && 'Last 90 days'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-4xl font-bold animate-pulse">Loading...</div>
          ) : (
            <div className="text-4xl font-bold text-green-600">
              {formatCurrency(summary?.grandTotalDollars || 0)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Service Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary?.byService.map((service) => (
          <Card key={service.service}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getServiceIcon(service.service)}
                {service.service === 'openai' && 'OpenAI'}
                {service.service === 'twilio' && 'Twilio'}
                {service.service === 'google_maps' && 'Google Maps'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(service.totalCostDollars)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {formatNumber(service.requestCount)} requests
              </div>
              <div className="text-sm text-muted-foreground">
                {formatNumber(service.totalUnits)} total units
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Spending Trend
          </CardTitle>
          <CardDescription>Cost breakdown by service over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse">Loading chart...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="openai"
                  stroke={SERVICE_COLORS.openai}
                  strokeWidth={2}
                  name="OpenAI"
                />
                <Line
                  type="monotone"
                  dataKey="twilio"
                  stroke={SERVICE_COLORS.twilio}
                  strokeWidth={2}
                  name="Twilio"
                />
                <Line
                  type="monotone"
                  dataKey="google_maps"
                  stroke={SERVICE_COLORS.google_maps}
                  strokeWidth={2}
                  name="Google Maps"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Usage by Channel
          </CardTitle>
          <CardDescription>
            Spending breakdown by communication channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel Totals */}
            <div className="space-y-3">
              {channel?.channelTotals.map((ch) => (
                <div
                  key={ch.channel}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getChannelIcon(ch.channel)}
                    <span className="font-medium capitalize">
                      {ch.channel === 'web_chat' && 'Web Chat'}
                      {ch.channel === 'sms' && 'SMS'}
                      {ch.channel === 'voice' && 'Voice'}
                      {ch.channel === 'unknown' && 'Unknown'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(ch.totalCostDollars)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(ch.requestCount)} requests
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              {channel && channel.channelTotals.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channel.channelTotals}
                      dataKey="totalCostDollars"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.channel}: ${formatCurrency(entry.totalCostDollars)}`}
                    >
                      {channel.channelTotals.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHANNEL_COLORS[entry.channel as keyof typeof CHANNEL_COLORS] || CHANNEL_COLORS.unknown}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month-over-Month Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Period:</span>
              <span className="font-medium">
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Services:</span>
              <span className="font-medium">{summary?.byService.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Requests:</span>
              <span className="font-medium">
                {formatNumber(
                  summary?.byService.reduce((sum, s) => sum + s.requestCount, 0) || 0
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
