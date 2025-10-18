import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertCircle, XCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RecentJobs() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/v1/social-proof/recent-jobs'],
    refetchInterval: 180000, // Refresh every 3 minutes
    staleTime: 120000, // Consider data stale after 2 minutes
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const recentJobs = jobs || [];
  const displayJobs = recentJobs.slice(0, 4);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'scheduled':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (displayJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No recent jobs
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayJobs.map((job: any) => (
        <div
          key={job.id}
          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
        >
          <div className="flex items-center gap-2 flex-1">
            {getStatusIcon(job.status || 'completed')}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {job.service}
              </p>
              <p className="text-xs text-muted-foreground">
                {job.city}, {job.state}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeAgo(job.completedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}