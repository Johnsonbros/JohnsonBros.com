import { useQuery } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

interface DashboardStats {
  today: {
    revenue: number;
  };
  week: {
    revenue: number;
  };
  month: {
    revenue: number;
  };
}

export default function RevenueTracker() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/v1/admin/dashboard/stats'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/stats'),
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const todayRevenue = stats?.today?.revenue || 0;
  const weekRevenue = stats?.week?.revenue || 0;
  const monthRevenue = stats?.month?.revenue || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-lg font-semibold">{formatCurrency(weekRevenue)}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">This Month</p>
          <p className="text-lg font-semibold">{formatCurrency(monthRevenue)}</p>
        </div>
      </div>
    </div>
  );
}
