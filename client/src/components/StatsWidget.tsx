import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Star, Calendar } from "lucide-react";

interface BusinessStats {
  totalJobsCompleted: number;
  totalCustomers: number;
  thisMonthJobs: number;
  averageJobValue: number;
}

export function StatsWidget() {
  const { data: stats, isLoading } = useQuery<BusinessStats>({
    queryKey: ["/api/social-proof/stats"],
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md" data-testid="stats-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Our Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="w-full max-w-md shadow-lg" data-testid="stats-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Our Success Story
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Jobs Completed Stat */}
        <div className="bg-yellow-50 p-6 rounded-lg text-center animate-fade-in-up mb-4" data-testid="stat-total-jobs">
          <div className="flex justify-center mb-3">
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600" data-testid="stat-value-total-jobs">
            {stats.totalJobsCompleted.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-2" data-testid="stat-label-total-jobs">
            Jobs Completed
          </div>
        </div>
        
        {/* Trust Badge */}
        <div className="text-center">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 px-4 py-2" data-testid="trust-badge">
            ⭐ Trusted by {stats.totalCustomers}+ customers
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}