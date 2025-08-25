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
    refetchInterval: 60000, // Refresh every minute
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

  const statItems = [
    {
      label: "Jobs Completed",
      value: stats.totalJobsCompleted.toLocaleString(),
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      testId: "total-jobs"
    },
    {
      label: "Happy Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      testId: "total-customers"
    },
    {
      label: "This Month",
      value: stats.thisMonthJobs.toLocaleString(),
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      testId: "month-jobs"
    },
    {
      label: "Avg. Job Value",
      value: `$${Math.round(stats.averageJobValue).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      testId: "avg-value"
    }
  ];

  return (
    <Card className="w-full max-w-md shadow-lg" data-testid="stats-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Our Success Story
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.testId}
                className={`${item.bgColor} p-4 rounded-lg text-center animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`stat-${item.testId}`}
              >
                <div className="flex justify-center mb-2">
                  <IconComponent className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className={`text-2xl font-bold ${item.color}`} data-testid={`stat-value-${item.testId}`}>
                  {item.value}
                </div>
                <div className="text-xs text-gray-600 mt-1" data-testid={`stat-label-${item.testId}`}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" data-testid="trust-badge">
            ⭐ Trusted by {stats.totalCustomers}+ customers
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}