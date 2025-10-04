import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentJob {
  id: string;
  serviceType: string;
  jobSummary: string;
  completedAt: string;
  city: string;
  state: string;
  technician: string;
  customerInitial: string;
  streetAddress: string;
}

export function RecentJobsWidget() {
  const { data: recentJobs = [], isLoading } = useQuery<RecentJob[]>({
    queryKey: ["/api/social-proof/recent-jobs"],
    refetchInterval: 180000, // Refresh every 3 minutes
    staleTime: 120000, // Consider data stale after 2 minutes
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md" data-testid="recent-jobs-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Completions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg" data-testid="recent-jobs-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Recent Completions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-3">
          {recentJobs.slice(0, 5).map((job, index) => (
            <div
              key={job.id}
              className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 rounded-r-lg animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`recent-job-${job.id}`}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-sm text-gray-900" data-testid={`service-type-${job.id}`}>
                  {job.jobSummary}
                </p>
                <Badge variant="outline" className="text-xs bg-green-100" data-testid={`location-badge-${job.id}`}>
                  {job.city}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span data-testid={`location-${job.id}`}>{job.city}, {job.state}</span>
                </div>
                
                {job.completedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span data-testid={`time-${job.id}`} title={`${new Date(job.completedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`}>
                      {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500" data-testid={`technician-${job.id}`}>
                  By {job.technician}
                </p>
                <p className="text-xs text-green-600 font-medium" data-testid={`status-${job.id}`}>
                  ✓ Completed
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {recentJobs.length === 0 && (
          <p className="text-center text-gray-500 py-4" data-testid="no-recent-jobs">
            No recent completions available
          </p>
        )}
      </CardContent>
    </Card>
  );
}