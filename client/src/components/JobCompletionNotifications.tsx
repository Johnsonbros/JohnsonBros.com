import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle, MapPin, User, X } from "lucide-react";
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

interface Notification {
  id: string;
  job: RecentJob;
  show: boolean;
}

export function JobCompletionNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: recentJobs = [] } = useQuery<RecentJob[]>({
    queryKey: ["/api/social-proof/recent-jobs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (recentJobs.length === 0) return;

    const showNextNotification = () => {
      const job = recentJobs[currentIndex % recentJobs.length];
      if (!job) return;

      const newNotification: Notification = {
        id: `${job.id}-${Date.now()}`,
        job,
        show: true,
      };

      setNotifications(prev => [...prev.slice(-2), newNotification]); // Keep only last 3 notifications

      // Hide notification after 6 seconds
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => n.id === newNotification.id ? { ...n, show: false } : n)
        );
      }, 6000);

      // Remove notification after animation completes
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 6500);

      setCurrentIndex(prev => prev + 1);
    };

    // Show first notification after 2 seconds
    const initialTimer = setTimeout(showNextNotification, 2000);

    // Then show notifications every 8-15 seconds randomly
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 7000 + 8000; // 8-15 seconds
      setTimeout(showNextNotification, randomDelay);
    }, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [recentJobs, currentIndex]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, show: false } : n)
    );
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80 
            transition-all duration-500 transform origin-bottom-right
            ${notification.show 
              ? 'translate-x-0 opacity-100 scale-100' 
              : 'translate-x-full opacity-0 scale-95'
            }
          `}
          data-testid={`job-notification-${notification.job.id}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Success Icon */}
              <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    Job Completed! 🎉
                  </h4>
                  <span className="text-xs text-gray-500 ml-2">
                    Just now
                  </span>
                </div>

                {/* Job Summary */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {notification.job.jobSummary}
                </p>

                {/* Location */}
                <div className="flex items-center text-xs text-gray-600 mb-2">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {notification.job.city}, {notification.job.state}
                  </span>
                </div>

                {/* Technician */}
                <div className="flex items-center text-xs text-gray-600">
                  <User className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    Completed by {notification.job.technician}
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              data-testid={`dismiss-notification-${notification.job.id}`}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full animate-shrink-width" 
              style={{ animationDuration: '6s' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}