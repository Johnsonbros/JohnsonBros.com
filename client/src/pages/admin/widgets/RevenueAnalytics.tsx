import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, DollarSign, Users, Target, ArrowUp, ArrowDown,
  CreditCard, RefreshCw, Award, ShoppingCart, Calculator
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface RevenueMetrics {
  overview: {
    totalRevenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    upsellRevenue: number;
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    averageOrderValue: number;
    growthRate: number;
  };
  subscriptions: {
    total: number;
    basic: number;
    premium: number;
    elite: number;
    newThisMonth: number;
    churnRate: number;
    conversionRate: number;
  };
  upsells: {
    totalAttempts: number;
    successful: number;
    conversionRate: number;
    averageValue: number;
    topPerformers: Array<{
      service: string;
      addOn: string;
      conversions: number;
      revenue: number;
    }>;
  };
  lifetime: {
    averageCustomerLifetimeValue: number;
    averageCustomerAge: number; // in months
    retentionRate: number;
    topCustomers: Array<{
      id: number;
      name: string;
      value: number;
      memberSince: string;
      plan: string;
    }>;
  };
  trends: {
    labels: string[];
    recurring: number[];
    oneTime: number[];
    upsell: number[];
  };
}

export default function RevenueAnalytics() {
  const { data: metrics, isLoading, refetch } = useQuery<RevenueMetrics>({
    queryKey: ['/api/v1/admin/revenue-metrics'],
    queryFn: () => authenticatedFetch('/api/v1/admin/revenue-metrics'),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getChangeIndicator = (value: number) => {
    if (value > 0) {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (value < 0) {
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return <div>No revenue data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring Revenue */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-green-600" data-testid="text-mrr">
                {formatCurrency(metrics.overview.mrr)}
              </p>
              {metrics.overview.growthRate !== 0 && (
                <div className={cn("flex items-center text-sm", 
                  metrics.overview.growthRate > 0 ? "text-green-600" : "text-red-600")}>
                  {getChangeIndicator(metrics.overview.growthRate)}
                  <span className="ml-1">{formatPercentage(Math.abs(metrics.overview.growthRate))}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ARR: {formatCurrency(metrics.overview.arr)}
            </p>
          </CardContent>
        </Card>

        {/* One-Time Revenue */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              One-Time Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600" data-testid="text-one-time-revenue">
              {formatCurrency(metrics.overview.oneTimeRevenue)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Avg Order: {formatCurrency(metrics.overview.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        {/* Upsell Revenue */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Upsell Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600" data-testid="text-upsell-revenue">
              {formatCurrency(metrics.overview.upsellRevenue)}
            </p>
            <div className="mt-2">
              <Progress 
                value={metrics.upsells.conversionRate * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formatPercentage(metrics.upsells.conversionRate)} conversion
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600" data-testid="text-total-revenue">
              {formatCurrency(metrics.overview.totalRevenue)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {formatPercentage(metrics.overview.recurringRevenue / metrics.overview.totalRevenue)} Recurring
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions & Customer Lifetime Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscription Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscription Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-xl font-bold" data-testid="text-total-subscribers">
                  {metrics.subscriptions.total}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-xl font-bold text-green-600">
                  +{metrics.subscriptions.newThisMonth}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Basic Plan</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(metrics.subscriptions.basic / metrics.subscriptions.total) * 100} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">{metrics.subscriptions.basic}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Premium Plan</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(metrics.subscriptions.premium / metrics.subscriptions.total) * 100} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">{metrics.subscriptions.premium}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Elite Plan</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(metrics.subscriptions.elite / metrics.subscriptions.total) * 100} 
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">{metrics.subscriptions.elite}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-600">Conversion Rate</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatPercentage(metrics.subscriptions.conversionRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Churn Rate</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatPercentage(metrics.subscriptions.churnRate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Lifetime Value */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Customer Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Average CLV</p>
                <p className="text-xl font-bold" data-testid="text-avg-clv">
                  {formatCurrency(metrics.lifetime.averageCustomerLifetimeValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Customer Age</p>
                <p className="text-xl font-bold">
                  {metrics.lifetime.averageCustomerAge} months
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Retention Rate</p>
              <Progress value={metrics.lifetime.retentionRate * 100} className="h-3" />
              <p className="text-xs text-gray-500 mt-1">
                {formatPercentage(metrics.lifetime.retentionRate)} of customers retained
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Top Value Customers</p>
              <div className="space-y-2">
                {metrics.lifetime.topCustomers.slice(0, 3).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.plan} Plan</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(customer.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upsell Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Upsell Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-xl font-bold">{metrics.upsells.totalAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Successful Conversions</p>
              <p className="text-xl font-bold text-green-600">{metrics.upsells.successful}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Upsell Value</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.upsells.averageValue)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Top Performing Upsells</p>
            <div className="space-y-2">
              {metrics.upsells.topPerformers.map((upsell, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {upsell.service} → {upsell.addOn}
                    </p>
                    <p className="text-xs text-gray-500">
                      {upsell.conversions} conversions
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(upsell.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}