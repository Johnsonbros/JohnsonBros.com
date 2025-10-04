import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, AlertTriangle, DollarSign, Users, Clock, 
  CheckCircle, AlertCircle, Loader2, RefreshCw, MapPin,
  Phone, User, Calendar, TrendingUp, Gauge
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface OperationsData {
  timestamp: string;
  capacity: {
    state: string;
    score: number;
    availableWindows: number;
    totalWindows: number;
    utilizationRate: number;
  };
  jobs: {
    total: number;
    byStatus: {
      scheduled: number;
      inProgress: number;
      completed: number;
      cancelled: number;
    };
    byTimeSlot: {
      morning: number;
      afternoon: number;
      evening: number;
    };
    emergencyCount: number;
  };
  revenue: {
    completed: number;
    scheduled: number;
    total: number;
    goal: number;
    progress: number;
  };
  technicians: Array<{
    id: string;
    name: string;
    status: 'available' | 'busy' | 'scheduled';
    currentJob: {
      id: string;
      customer: string;
      address: string;
      scheduledTime: string;
    } | null;
    jobCount: number;
    completedToday: number;
  }>;
  alerts: Array<{
    type: 'emergency' | 'capacity' | 'system';
    message: string;
    jobId?: string;
    timestamp: string;
  }>;
}

interface JobBoardData {
  timestamp: string;
  date: string;
  jobs: Array<{
    id: string;
    customer: {
      name: string;
      phone?: string;
      email?: string;
    };
    address: {
      street?: string;
      city?: string;
      zip?: string;
    };
    service: {
      type: string;
      description?: string;
      tags: string[];
    };
    schedule: {
      start: string;
      end: string;
      duration: number;
    };
    technician: Array<{
      id: string;
      name: string;
    }>;
    status: string;
    amount: number;
    isPriority: boolean;
    notes?: string;
  }>;
}

export default function OperationsDashboard() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch operations data
  const { data: operations, isLoading: opsLoading, refetch: refetchOps } = useQuery<OperationsData>({
    queryKey: ['/api/admin/dashboard/operations'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/operations'),
    refetchInterval: autoRefresh ? 60000 : false, // Auto-refresh every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  // Fetch job board data
  const { data: jobBoard, isLoading: jobsLoading, refetch: refetchJobs } = useQuery<JobBoardData>({
    queryKey: ['/api/admin/dashboard/job-board'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/job-board'),
    refetchInterval: autoRefresh ? 120000 : false, // Auto-refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  // Job reassignment mutation
  const reassignMutation = useMutation({
    mutationFn: async (params: { jobId: string; technicianId: string; scheduledStart: string }) => {
      return authenticatedFetch(`/api/admin/dashboard/jobs/${params.jobId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCapacityColor = (state: string) => {
    switch (state) {
      case 'SAME_DAY_FEE_WAIVED':
        return 'text-green-600 bg-green-50';
      case 'LIMITED_SAME_DAY':
        return 'text-yellow-600 bg-yellow-50';
      case 'NEXT_DAY':
        return 'text-orange-600 bg-orange-50';
      case 'BOOKED_SOLID':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTechStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'busy':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (opsLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-johnson-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Operations Command Center</h2>
          <p className="text-gray-600 mt-1">Real-time operational dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Last updated: {operations && new Date(operations.timestamp).toLocaleTimeString()}
          </span>
          <Button
            onClick={() => {
              refetchOps();
              refetchJobs();
            }}
            size="sm"
            variant="outline"
            data-testid="button-refresh-operations"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            data-testid="button-toggle-auto-refresh"
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {operations?.alerts && operations.alerts.length > 0 && (
        <div className="space-y-2">
          {operations.alerts.map((alert, index) => (
            <Alert key={index} className={alert.type === 'emergency' ? 'border-red-500' : ''}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="capitalize">{alert.type} Alert</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity Gauge */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Capacity Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("inline-flex px-3 py-1 rounded-full text-sm font-semibold", 
              operations && getCapacityColor(operations.capacity.state))}>
              {operations?.capacity.state.replace(/_/g, ' ')}
            </div>
            <div className="mt-2">
              <Progress value={operations?.capacity.utilizationRate || 0} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {operations?.capacity.utilizationRate}% Utilized
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Tracker */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-revenue-completed">
              {formatCurrency(operations?.revenue.completed || 0)}
            </p>
            <Progress value={operations?.revenue.progress || 0} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              Goal: {formatCurrency(operations?.revenue.goal || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Jobs Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Job Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">In Progress</span>
                <span className="text-sm font-bold text-blue-600">
                  {operations?.jobs.byStatus.inProgress || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Scheduled</span>
                <span className="text-sm font-bold text-gray-600">
                  {operations?.jobs.byStatus.scheduled || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Completed</span>
                <span className="text-sm font-bold text-green-600">
                  {operations?.jobs.byStatus.completed || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Technician Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Available</span>
                <span className="text-sm font-bold text-green-600">
                  {operations?.technicians.filter(t => t.status === 'available').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Busy</span>
                <span className="text-sm font-bold text-blue-600">
                  {operations?.technicians.filter(t => t.status === 'busy').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Total Active</span>
                <span className="text-sm font-bold">
                  {operations?.technicians.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Board - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Today's Job Board</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {jobBoard?.jobs.map((job) => (
                    <div
                      key={job.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-colors",
                        selectedJob === job.id ? "border-johnson-orange bg-orange-50" : "hover:bg-gray-50",
                        job.isPriority && "border-red-300 bg-red-50"
                      )}
                      onClick={() => setSelectedJob(job.id)}
                      data-testid={`job-card-${job.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {job.customer.name}
                            {job.isPriority && <Badge variant="destructive">Priority</Badge>}
                          </h4>
                          <p className="text-sm text-gray-600">{job.service.type}</p>
                        </div>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          {formatTime(job.schedule.start)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="h-3 w-3" />
                          {job.technician.map(t => t.name).join(', ') || 'Unassigned'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {job.address.street || 'No address'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(job.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Technician Panel - 1 column */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Technician Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {operations?.technicians.map((tech) => (
                    <div
                      key={tech.id}
                      className="border rounded-lg p-3"
                      data-testid={`tech-card-${tech.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          {getTechStatusIcon(tech.status)}
                          {tech.name}
                        </h4>
                        <Badge variant="outline">
                          {tech.completedToday}/{tech.jobCount} jobs
                        </Badge>
                      </div>
                      
                      {tech.currentJob && (
                        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded p-2">
                          <p className="font-medium">Current Job:</p>
                          <p className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {tech.currentJob.customer}
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tech.currentJob.address}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(tech.currentJob.scheduledTime)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}