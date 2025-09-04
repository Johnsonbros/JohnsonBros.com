import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RevenueTracker() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/housecall-metrics'],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const todayRevenue = metrics?.revenue?.today || 0;
  const weekRevenue = metrics?.revenue?.week || 0;
  const monthRevenue = metrics?.revenue?.month || 0;

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
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">+12%</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">This Month</p>
          <p className="text-lg font-semibold">{formatCurrency(monthRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">+8%</span>
          </div>
        </div>
      </div>
    </div>
  );
}