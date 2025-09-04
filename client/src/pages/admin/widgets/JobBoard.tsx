import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, User, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function JobBoard() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/job-board'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const todayJobs = jobs?.todayJobs || [];
  const displayJobs = todayJobs.slice(0, 3);

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
              <h4 className="font-medium text-sm">{job.customer?.first_name} {job.customer?.last_name}</h4>
              <p className="text-xs text-muted-foreground">{job.job_type}</p>
            </div>
            <Badge variant="outline" className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(job.scheduled_start)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{job.employee?.first_name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.address?.city || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>${job.total_amount || '0'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}