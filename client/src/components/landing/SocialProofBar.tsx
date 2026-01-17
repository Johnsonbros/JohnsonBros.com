import { Users, Activity, TrendingUp, Clock, Star, MapPin } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface RecentJob {
  id: string;
  service: string;
  location: string;
  timeAgo: string;
}

interface SocialProofBarProps {
  position?: 'top' | 'bottom' | 'inline';
  showViewers?: boolean;
  showRecentJobs?: boolean;
  showStats?: boolean;
  animateJobs?: boolean;
}

export function SocialProofBar({
  position = 'inline',
  showViewers = true,
  showRecentJobs = true,
  showStats = true,
  animateJobs = true
}: SocialProofBarProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [jobIndex, setJobIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch recent jobs from API
  const { data: recentJobs = [] } = useQuery({
    queryKey: ['/api/v1/social-proof/recent-jobs'],
    select: (data: any[]) => data.slice(0, 10).map(job => ({
      id: job.id,
      service: job.type || 'Plumbing Service',
      location: job.location || 'Quincy, MA',
      timeAgo: job.timeAgo || 'Just now'
    }))
  });

  // Fetch stats
  const { data: stats } = useQuery<{ totalJobsCompleted: number }>({
    queryKey: ['/api/v1/social-proof/stats']
  });

  // Simulate viewer count
  useEffect(() => {
    setViewerCount(Math.floor(Math.random() * 8) + 5);
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1;
        const newCount = prev + change;
        return Math.max(3, Math.min(15, newCount));
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through recent jobs
  useEffect(() => {
    if (!animateJobs || recentJobs.length === 0) return;

    const interval = setInterval(() => {
      setJobIndex((prev) => (prev + 1) % recentJobs.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [recentJobs, animateJobs]);

  const containerClass = position === 'top'
    ? 'fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-johnson-blue to-johnson-teal text-white shadow-lg'
    : position === 'bottom'
      ? 'fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-johnson-blue to-johnson-teal text-white shadow-lg'
      : 'bg-gradient-to-r from-johnson-blue/10 to-johnson-orange/10 rounded-lg';

  const textColorClass = position === 'inline' ? 'text-gray-700' : 'text-white';
  const badgeVariant = position === 'inline' ? 'secondary' : 'default';

  return (
    <div className={`${containerClass} py-3 px-4 overflow-hidden`}>
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Live Viewers */}
          {showViewers && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <div className="relative w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <span className={`text-sm font-medium ${textColorClass}`}>
                <span className="font-bold">{viewerCount}</span> people viewing now
              </span>
            </div>
          )}

          {/* Recent Jobs Ticker */}
          {showRecentJobs && recentJobs.length > 0 && (
            <div className="flex-1 max-w-md overflow-hidden">
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${position === 'inline' ? 'text-johnson-blue' : 'text-yellow-400'}`} />
                <div ref={scrollRef} className="overflow-hidden flex-1">
                  <div
                    className="transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateY(-${jobIndex * 24}px)` }}
                  >
                    {recentJobs.map((job, index) => (
                      <div
                        key={job.id}
                        className={`text-sm ${textColorClass} h-6 flex items-center`}
                      >
                        <span className="font-medium">{job.service}</span>
                        <span className={`mx-2 ${position === 'inline' ? 'text-gray-400' : 'text-white/60'}`}>•</span>
                        <MapPin className="h-3 w-3 mr-1 opacity-60" />
                        <span className="opacity-80">{job.location}</span>
                        <span className={`ml-2 ${position === 'inline' ? 'text-gray-400' : 'text-white/60'}`}>
                          ({job.timeAgo})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {showStats && stats && (
            <div className="flex items-center gap-4">
              <Badge variant={badgeVariant} className="gap-1">
                <Users className="h-3 w-3" />
                {stats.totalJobsCompleted?.toLocaleString() || '5000+'} Served
              </Badge>
              <Badge variant={badgeVariant} className="gap-1">
                <Star className="h-3 w-3" />
                4.9★ Rating
              </Badge>
              <Badge variant={badgeVariant} className="gap-1 hidden sm:inline-flex">
                <Clock className="h-3 w-3" />
                30min Avg
              </Badge>
            </div>
          )}

          {/* Urgency Indicator */}
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${position === 'inline' ? 'text-red-600' : 'text-yellow-400'} animate-pulse`} />
            <span className={`text-sm font-medium ${textColorClass}`}>
              High demand today
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}