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
  const [activeTimeouts, setActiveTimeouts] = useState<Set<NodeJS.Timeout>>(new Set());

  const { data: recentJobs = [] } = useQuery<RecentJob[]>({
    queryKey: ["/api/social-proof/recent-jobs"],
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (recentJobs.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    const localTimeouts = new Set<NodeJS.Timeout>();

    const scheduleNextNotification = () => {
      // Random delay between 45 seconds to 3 minutes (more organic)
      const randomDelay = Math.random() * 135000 + 45000; // 45-180 seconds
      
      timeoutId = setTimeout(() => {
        // Only show if no notification is currently visible
        if (notifications.length === 0) {
          const job = recentJobs[currentIndex % recentJobs.length];
          if (job) {
            const newNotification: Notification = {
              id: `${job.id}-${Date.now()}`,
              job,
              show: true,
            };

            setNotifications([newNotification]);

            // Hide notification after 5 seconds
            const hideTimeout = setTimeout(() => {
              setNotifications(prev => 
                prev.map(n => n.id === newNotification.id ? { ...n, show: false } : n)
              );
            }, 5000);
            localTimeouts.add(hideTimeout);

            // Remove notification after animation completes
            const removeTimeout = setTimeout(() => {
              setNotifications([]);
              localTimeouts.delete(hideTimeout);
              localTimeouts.delete(removeTimeout);
            }, 5500);
            localTimeouts.add(removeTimeout);

            setCurrentIndex(prev => prev + 1);
          }
        }
        
        // Schedule the next notification
        scheduleNextNotification();
      }, randomDelay);
      localTimeouts.add(timeoutId);
    };

    // Initial delay (10-30 seconds after page load)
    const initialDelay = Math.random() * 20000 + 10000;
    timeoutId = setTimeout(() => {
      scheduleNextNotification();
    }, initialDelay);
    localTimeouts.add(timeoutId);

    return () => {
      // Clear all timeouts on unmount
      localTimeouts.forEach(timeout => clearTimeout(timeout));
      clearTimeout(timeoutId);
    };
  }, [recentJobs]); // Only depend on recentJobs to avoid infinite loops

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, show: false } : n)
    );
    const dismissTimeout = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
    // Add to active timeouts for cleanup if needed
    setActiveTimeouts(prev => new Set(prev).add(dismissTimeout));
    // Remove from set after execution
    setTimeout(() => {
      setActiveTimeouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(dismissTimeout);
        return newSet;
      });
    }, 350);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-72 
            transition-all duration-300 transform origin-bottom-right
            ${notification.show 
              ? 'translate-x-0 opacity-100 scale-100' 
              : 'translate-x-full opacity-0 scale-95'
            }
          `}
          data-testid={`job-notification-${notification.job.id}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              {/* Success Icon */}
              <div className="bg-green-100 rounded-full p-1.5 flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-gray-900 truncate">
                    Job Completed! 🎉
                  </h4>
                  <span className="text-xs text-gray-500 ml-1">
                    Just now
                  </span>
                </div>

                {/* Job Summary */}
                <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                  {notification.job.jobSummary}
                </p>

                {/* Location and Technician in one line */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center truncate">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {notification.job.city}, {notification.job.state}
                    </span>
                  </div>
                  
                  <div className="flex items-center ml-2 flex-shrink-0">
                    <User className="h-3 w-3 mr-1" />
                    <span className="truncate">
                      {notification.job.technician}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              data-testid={`dismiss-notification-${notification.job.id}`}
            >
              <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-0.5">
            <div 
              className="bg-green-500 h-0.5 rounded-full animate-shrink-width" 
              style={{ animationDuration: '5s' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}