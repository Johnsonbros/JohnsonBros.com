import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, MapPin, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface LiveActivity {
  id: string;
  serviceType: string;
  status: string;
  scheduledTime: string;
  city: string;
  state: string;
}

export function LiveActivityWidget() {
  const { data: activities = [], isLoading } = useQuery<LiveActivity[]>({
    queryKey: ["/api/social-proof/live-activity"],
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md" data-testid="live-activity-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500 animate-pulse" />
            Live Activity
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg" data-testid="live-activity-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-orange-500 animate-pulse" />
          Live Activity
          <Badge variant="outline" className="ml-auto bg-orange-50 text-orange-700" data-testid="activity-count">
            {activities.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-3">
          {activities.slice(0, 6).map((activity, index) => (
            <div
              key={activity.id}
              className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`activity-${activity.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900" data-testid={`activity-service-${activity.id}`}>
                    {activity.serviceType}
                  </p>
                  <p className="text-xs text-gray-600" data-testid={`activity-location-${activity.id}`}>
                    {activity.city}, {activity.state}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(activity.status)}`}
                  data-testid={`activity-status-${activity.id}`}
                >
                  {getStatusText(activity.status)}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  <span data-testid={`activity-tech-${activity.id}`}>Our team</span>
                </div>
                
                {activity.scheduledTime && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span data-testid={`activity-time-${activity.id}`}>
                      {activity.status === 'in_progress' 
                        ? 'In progress now'
                        : format(new Date(activity.scheduledTime), 'MMM d, h:mm a')
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-6" data-testid="no-live-activity">
            <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No current activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}