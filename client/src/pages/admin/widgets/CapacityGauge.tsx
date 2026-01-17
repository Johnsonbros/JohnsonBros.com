import { useQuery } from '@tanstack/react-query';
import { Gauge, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CapacityData {
  overall: {
    score: number;
    state: string;
  };
}

export default function CapacityGauge() {
  const { data: capacity, isLoading } = useQuery<CapacityData>({
    queryKey: ['/api/v1/capacity/today'],
    refetchInterval: 120000,
    staleTime: 60000,
    refetchIntervalInBackground: false,
  });

  if (isLoading) {
    return <div className="animate-pulse h-full bg-gray-100 rounded" />;
  }

  const score = capacity?.overall?.score || 0;
  const state = capacity?.overall?.state || 'NEXT_DAY';
  const percentage = Math.round(score * 100);

  const getStateColor = () => {
    if (state === 'SAME_DAY_FEE_WAIVED') return 'text-green-600';
    if (state === 'LIMITED_SAME_DAY') return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getGaugeColor = () => {
    if (percentage > 70) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-3">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
            className={cn('transition-all duration-500', getGaugeColor())}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl font-bold">{percentage}%</span>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
        </div>
      </div>

      <div className={cn('text-sm font-medium', getStateColor())}>
        {state.replace(/_/g, ' ')}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Updates every 2 min</span>
      </div>
    </div>
  );
}