import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Wrench, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ServiceHeatMap } from '@/components/ServiceHeatMap';

interface CheckIn {
  id: number;
  jobId: string;
  technicianName: string | null;
  customerName: string | null;
  serviceType: string;
  city: string | null;
  state: string | null;
  status: string;
  checkInTime: string;
  completedAt: string | null;
  notes: string | null;
}

export default function CheckInsPage() {
  const { data: checkInsData, isLoading } = useQuery<{ checkIns: CheckIn[]; count: number }>({
    queryKey: ['/api/v1/checkins'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Wrench className="h-4 w-4 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 lg:pb-0">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-page-title">
              Live Service Activity
            </h1>
            <p className="text-xl text-blue-100">
              See where we're working right now and recent service completions
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-total-checkins">
                      {checkInsData?.count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Recent Check-ins</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-completed-today">
                      {checkInsData?.checkIns?.filter(c => c.status === 'completed')?.length ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed Jobs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-in-progress">
                      {checkInsData?.checkIns?.filter(c => c.status === 'in_progress')?.length ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Service Coverage Heatmap
              </CardTitle>
              <CardDescription>
                See where our team is actively serving customers across the South Shore.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceHeatMap />
            </CardContent>
          </Card>

          {/* Check-ins List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Recent Service Activity
              </CardTitle>
              <CardDescription>
                Live updates showing where we're working and what we're doing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3" data-testid="checkins-loading">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : checkInsData?.checkIns && checkInsData.checkIns.length > 0 ? (
                <div className="space-y-3" data-testid="checkins-list">
                  {checkInsData.checkIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      data-testid={`checkin-item-${checkIn.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(checkIn.status)} data-testid={`badge-status-${checkIn.id}`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(checkIn.status)}
                                {getStatusText(checkIn.status)}
                              </span>
                            </Badge>
                            <div className="flex items-center gap-1" data-testid={`text-time-${checkIn.id}`}>
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(checkIn.checkInTime), { addSuffix: true })}
                            </div>
                          </div>

                          <div className="font-medium text-lg" data-testid={`text-service-${checkIn.id}`}>
                            {checkIn.serviceType}
                            {checkIn.city && (
                              <span className="text-base text-muted-foreground font-normal">
                                {' '}in {checkIn.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="checkins-empty">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Proof Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">We're Always On The Move</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our team is actively serving customers across the South Shore. See real-time updates 
              as we complete jobs and help more families with their plumbing needs.
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                <div className="text-muted-foreground">Emergency Service</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                <div className="text-muted-foreground">Customer Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">Fast</div>
                <div className="text-muted-foreground">Same-Day Service</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
