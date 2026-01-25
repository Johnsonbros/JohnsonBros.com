import { useQuery } from '@tanstack/react-query';
import { User, Circle, Wrench, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/auth';

interface OperationsResponse {
  technicians: Array<{
    id: string;
    name: string;
    status: 'available' | 'busy' | 'scheduled';
  }>;
}

export default function TechnicianStatus() {
  const { data: operations, isLoading } = useQuery<OperationsResponse>({
    queryKey: ['/api/v1/admin/dashboard/operations'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/operations'),
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const technicians = operations?.technicians || [];

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'busy':
        return <Wrench className="h-3 w-3" />;
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      case 'available':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'busy':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-yellow-500';
      case 'available':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (technicians.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No technicians online
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {technicians.slice(0, 4).map((tech: any) => (
        <div
          key={tech.id}
          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', getStatusColor(tech.status))} />
            <span className="text-sm font-medium">{tech.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(tech.status)}
            <span className="text-xs text-muted-foreground capitalize">
              {tech.status === 'busy' ? 'in progress' : tech.status?.replace('_', ' ')}
            </span>
          </div>
        </div>
      ))}
      
      {technicians.length > 4 && (
        <p className="text-xs text-center text-muted-foreground">
          +{technicians.length - 4} more
        </p>
      )}
    </div>
  );
}
