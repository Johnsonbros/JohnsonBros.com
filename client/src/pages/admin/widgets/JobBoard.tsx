import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, User, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { authenticatedFetch } from '@/lib/auth';

interface JobBoardResponse {
  jobs: Array<{
    id: string;
    customer: {
      name: string;
    };
    address: {
      city?: string;
    };
    service: {
      type: string;
    };
    schedule: {
      start: string;
    };
    technician: Array<{
      name: string;
    }>;
    status: string;
    amount: number;
  }>;
}

export default function JobBoard() {
  const { data: jobBoard, isLoading } = useQuery<JobBoardResponse>({
    queryKey: ['/api/v1/admin/dashboard/job-board'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/job-board'),
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const displayJobs = jobBoard?.jobs?.slice(0, 3) || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (displayJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No jobs scheduled for today
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayJobs.map((job: any) => (
        <div
          key={job.id}
          className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{job.customer?.name || 'Unknown Customer'}</h4>
              <p className="text-xs text-muted-foreground">{job.service?.type || 'Service'}</p>
            </div>
            <Badge variant="outline" className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{job.schedule?.start ? formatTime(job.schedule.start) : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{job.technician?.[0]?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.address?.city || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(job.amount || 0)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
