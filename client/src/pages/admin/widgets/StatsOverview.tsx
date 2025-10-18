import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, Star, TrendingUp } from 'lucide-react';

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/dashboard/stats'],
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const statItems = [
    {
      label: 'Total Customers',
      value: stats?.customers?.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'Jobs Today',
      value: stats?.jobs?.today || 0,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      label: 'Avg Rating',
      value: '4.8',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      label: 'Completion Rate',
      value: '96%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((stat, index) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <div className={`h-6 w-6 rounded-full ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`h-3 w-3 ${stat.color}`} />
            </div>
          </div>
          <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}