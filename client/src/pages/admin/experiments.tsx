import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  PlayCircle, PauseCircle, StopCircle, TrendingUp, TrendingDown,
  Users, Target, DollarSign, Clock, AlertCircle, CheckCircle,
  Download, RefreshCw, Plus, Edit2, Trash2, Copy, Share2,
  BarChart3, PieChart as PieChartIcon, Activity, Zap,
  ArrowUp, ArrowDown, Filter, Calendar, Info, Trophy,
  Beaker, GitBranch, Layers, Flag, Eye, MousePointer,
  FormInput, Upload, Video, Map, ChevronRight, ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO, subDays } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types
interface ABTestVariant {
  id: number;
  variantId: string;
  name: string;
  weight: number;
  isControl: boolean;
  changes: Record<string, any>;
  metrics?: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgRevenuePerUser?: number;
    bounceRate?: number;
    avgTimeOnPage?: number;
  };
  lift?: number;
  confidence?: number;
  requiredSampleSize?: number;
}

interface ABTest {
  id: number;
  testId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  trafficAllocation: number;
  startDate?: string;
  endDate?: string;
  winnerVariantId?: string;
  variants: ABTestVariant[];
  totalImpressions: number;
  totalConversions: number;
  overallConversionRate: number;
  revenue?: number;
}

interface ConversionFunnel {
  funnelId: string;
  stages: {
    stage: string;
    visitors: number;
    avgTimeInStage: number;
    conversionRate: number;
  }[];
  totalConversion: number;
}

interface AttributionMetric {
  dimension: string;
  conversions: number;
  totalValue: number;
  avgValue: number;
  uniqueSessions: number;
}

interface MicroConversionMetric {
  eventType: string;
  count: number;
  uniqueSessions: number;
  avgPerSession: number;
}

interface Recommendation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  action: string;
  [key: string]: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ExperimentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExperiment, setSelectedExperiment] = useState<ABTest | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('experiments');

  // Fetch experiments
  const { data: experiments, isLoading: experimentsLoading } = useQuery<ABTest[]>({
    queryKey: ['/api/v1/experiments'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch conversion funnels
  const { data: funnels, isLoading: funnelsLoading } = useQuery<ConversionFunnel>({
    queryKey: ['/api/v1/conversions/funnel/booking'],
    queryFn: () => apiRequest('GET', '/api/v1/conversions/funnel/booking').then(res => res.json())
  });

  // Fetch attribution metrics
  const { data: attribution, isLoading: attributionLoading } = useQuery<AttributionMetric[]>({
    queryKey: ['/api/v1/conversions/attribution', dateRange],
    queryFn: () => apiRequest('GET', `/api/v1/conversions/attribution?startDate=${subDays(new Date(), dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90).toISOString()}`).then(res => res.json())
  });

  // Fetch micro-conversions
  const { data: microConversions } = useQuery<MicroConversionMetric[]>({
    queryKey: ['/api/v1/conversions/micro'],
    queryFn: () => apiRequest('GET', '/api/v1/conversions/micro').then(res => res.json())
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['/api/v1/conversions/recommendations'],
    queryFn: () => apiRequest('GET', '/api/v1/conversions/recommendations').then(res => res.json())
  });

  // Fetch experiment recommendations
  const { data: experimentRecommendations } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['/api/v1/experiments/recommendations'],
    queryFn: () => apiRequest('GET', '/api/v1/experiments/recommendations').then(res => res.json())
  });

  // Start experiment mutation
  const startExperiment = useMutation({
    mutationFn: (testId: string) =>
      apiRequest('POST', `/api/v1/experiments/${testId}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/experiments'] });
      toast({ title: 'Experiment started successfully' });
    }
  });

  // Pause experiment mutation
  const pauseExperiment = useMutation({
    mutationFn: (testId: string) =>
      apiRequest('POST', `/api/v1/experiments/${testId}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/experiments'] });
      toast({ title: 'Experiment paused' });
    }
  });

  // Complete experiment mutation
  const completeExperiment = useMutation({
    mutationFn: ({ testId, winnerVariantId }: { testId: string; winnerVariantId?: string }) =>
      apiRequest('POST', `/api/v1/experiments/${testId}/complete`, { winnerVariantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/experiments'] });
      toast({ title: 'Experiment completed' });
    }
  });

  // Roll out winner mutation
  const rollOutWinner = useMutation({
    mutationFn: (testId: string) =>
      apiRequest('POST', `/api/v1/experiments/${testId}/rollout`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/experiments'] });
      toast({ title: 'Winner rolled out to 100% of traffic' });
    }
  });

  // Export experiment data
  const exportExperiment = async (testId: string, format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/v1/experiments/${testId}/export?format=${format}`, {
        credentials: 'include'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experiment-${testId}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: 'Failed to export data', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 90) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Beaker className="h-8 w-8" />
            Experiments & Conversion Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage A/B tests, track conversions, and analyze performance
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {/* Recommendations Alert */}
      {((recommendations?.recommendations?.length ?? 0) > 0 || (experimentRecommendations?.recommendations?.length ?? 0) > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {[...(recommendations?.recommendations || []), ...(experimentRecommendations?.recommendations || [])]
                .filter((r: Recommendation) => r.severity === 'high')
                .slice(0, 3)
                .map((rec: Recommendation, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Badge variant={rec.severity === 'high' ? 'destructive' : 'secondary'}>
                      {rec.type.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.message}</p>
                      <p className="text-sm text-muted-foreground">{rec.action}</p>
                    </div>
                  </div>
                ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="experiments" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Experiments
          </TabsTrigger>
          <TabsTrigger value="conversions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversion Tracking
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="space-y-4">
          {/* Metrics Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments?.filter((e: ABTest) => e.status === 'active').length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments?.reduce((sum: number, e: ABTest) => sum + e.totalImpressions, 0).toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all tests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(experiments?.length ?? 0) > 0
                    ? (experiments!.reduce((sum: number, e: ABTest) => sum + e.overallConversionRate, 0) / experiments!.length * 100).toFixed(2)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tests with Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments?.filter((e: ABTest) => e.winnerVariantId).length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready to roll out
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Experiments List */}
          <Card>
            <CardHeader>
              <CardTitle>Active & Recent Experiments</CardTitle>
              <CardDescription>
                Manage your A/B tests and feature experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experimentsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : experiments?.length === 0 ? (
                  <div className="text-center p-8">
                    <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No experiments created yet</p>
                    <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                      Create Your First Experiment
                    </Button>
                  </div>
                ) : (
                  experiments?.map((experiment: ABTest) => (
                    <div key={experiment.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{experiment.name}</h3>
                            <Badge className={getStatusColor(experiment.status)}>
                              {experiment.status}
                            </Badge>
                            {experiment.winnerVariantId && (
                              <Badge variant="outline" className="border-green-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                Has Winner
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {experiment.description}
                          </p>
                          {experiment.startDate && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Started {formatDistanceToNow(parseISO(experiment.startDate), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {experiment.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => startExperiment.mutate(experiment.testId)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {experiment.status === 'active' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => pauseExperiment.mutate(experiment.testId)}
                            >
                              <PauseCircle className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          {experiment.status === 'paused' && (
                            <Button
                              size="sm"
                              onClick={() => startExperiment.mutate(experiment.testId)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          {experiment.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const winner = experiment.variants.find(v => !v.isControl && v.confidence && v.confidence >= 95);
                                completeExperiment.mutate({
                                  testId: experiment.testId,
                                  winnerVariantId: winner?.variantId
                                });
                              }}
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          {experiment.winnerVariantId && experiment.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => rollOutWinner.mutate(experiment.testId)}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Roll Out Winner
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportExperiment(experiment.testId, 'csv')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedExperiment(experiment);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Traffic Allocation */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Traffic Allocation</span>
                          <span className="font-medium">{(experiment.trafficAllocation * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={experiment.trafficAllocation * 100} />
                      </div>

                      {/* Variants Performance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {experiment.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className={`border rounded-lg p-3 ${experiment.winnerVariantId === variant.variantId ? 'border-green-600 bg-green-50' : ''
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{variant.name}</span>
                                {variant.isControl && (
                                  <Badge variant="outline" className="text-xs">Control</Badge>
                                )}
                                {experiment.winnerVariantId === variant.variantId && (
                                  <Trophy className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {variant.weight}%
                              </span>
                            </div>

                            {variant.metrics && (
                              <>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Visitors:</span>
                                    <span>{variant.metrics.impressions.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Conversions:</span>
                                    <span>{variant.metrics.conversions.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Conv. Rate:</span>
                                    <span className="font-medium">
                                      {(variant.metrics.conversionRate * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                </div>

                                {!variant.isControl && variant.lift !== undefined && (
                                  <div className="mt-2 pt-2 border-t space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Lift:</span>
                                      <span className={variant.lift > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {variant.lift > 0 ? '+' : ''}{variant.lift.toFixed(1)}%
                                      </span>
                                    </div>
                                    {variant.confidence !== undefined && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Confidence:</span>
                                        <span className={getConfidenceColor(variant.confidence)}>
                                          {variant.confidence}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Tracking Tab */}
        <TabsContent value="conversions" className="space-y-4">
          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Track visitor progression through your conversion funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnels && (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnels.stages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visitors" fill="#0088FE">
                        {funnels.stages.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {funnels.stages.map((stage: any, idx: number) => (
                      <div key={idx} className="text-center">
                        <div className="text-2xl font-bold">{stage.visitors.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{stage.stage}</div>
                        {idx > 0 && (
                          <div className="text-sm mt-1">
                            <span className={stage.conversionRate > 50 ? 'text-green-600' : 'text-red-600'}>
                              {stage.conversionRate.toFixed(1)}% conversion
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Overall funnel conversion rate: <strong>{funnels.totalConversion.toFixed(2)}%</strong>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attribution Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Attribution by Source</CardTitle>
              <CardDescription>
                Understand which traffic sources drive conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attribution && attribution.length > 0 && (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attribution}
                        dataKey="conversions"
                        nameKey="dimension"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                      >
                        {attribution.map((entry: AttributionMetric, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {attribution.map((source: AttributionMetric, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="font-medium">{source.dimension}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div>{source.conversions} conversions</div>
                          <div className="text-muted-foreground">
                            ${source.avgValue.toFixed(2)} avg value
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Micro-conversions */}
          <Card>
            <CardHeader>
              <CardTitle>Micro-conversions</CardTitle>
              <CardDescription>
                Track smaller engagement actions that lead to conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {microConversions && microConversions.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {microConversions.map((micro: MicroConversionMetric) => (
                    <div key={micro.eventType} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {micro.eventType.includes('form') && <FormInput className="h-4 w-4" />}
                        {micro.eventType.includes('photo') && <Upload className="h-4 w-4" />}
                        {micro.eventType.includes('video') && <Video className="h-4 w-4" />}
                        {micro.eventType.includes('scroll') && <MousePointer className="h-4 w-4" />}
                        <span className="text-sm font-medium">
                          {micro.eventType.replace(/_/g, ' ').replace('micro ', '')}
                        </span>
                      </div>
                      <div className="text-2xl font-bold">{micro.count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {micro.avgPerSession.toFixed(1)} per session
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Experiments Run</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{experiments?.length || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  All time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg. Lift Achieved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(experiments?.length ?? 0) > 0
                    ? experiments!
                      .flatMap((e: ABTest) => e.variants.filter(v => !v.isControl && v.lift))
                      .reduce((sum: number, v: ABTestVariant, _, arr) =>
                        sum + (v.lift || 0) / arr.length, 0)
                      .toFixed(1)
                    : 0}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                  Average improvement
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tests with 95% Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments?.filter((e: ABTest) =>
                    e.variants.some(v => !v.isControl && v.confidence && v.confidence >= 95)
                  ).length || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  Statistically significant
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${experiments?.reduce((sum: number, e: ABTest) =>
                    sum + (e.revenue || 0), 0).toLocaleString() || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <DollarSign className="h-3 w-3 mr-1 text-green-600" />
                  From winning variants
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experiment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Experiment Timeline</CardTitle>
              <CardDescription>
                Track the lifecycle and performance of your experiments over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {experiments && experiments.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={experiments.map((e: ABTest) => ({
                    name: e.name,
                    impressions: e.totalImpressions,
                    conversions: e.totalConversions,
                    conversionRate: e.overallConversionRate * 100
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="impressions"
                      stroke="#8884d8"
                      name="Impressions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversionRate"
                      stroke="#82ca9d"
                      name="Conversion Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Control feature rollouts and experimental features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'AI Booking Assistant',
                    key: 'ai_booking',
                    description: 'Enable AI-powered booking assistant',
                    enabled: true
                  },
                  {
                    name: 'Express Booking',
                    key: 'express_booking',
                    description: 'Quick booking flow for returning customers',
                    enabled: true
                  },
                  {
                    name: 'Live Chat',
                    key: 'live_chat',
                    description: 'Real-time chat support',
                    enabled: false
                  },
                  {
                    name: 'Session Recording',
                    key: 'session_recording',
                    description: 'Record user sessions for analysis',
                    enabled: false
                  },
                  {
                    name: 'Heatmap Tracking',
                    key: 'heatmap',
                    description: 'Track click and scroll heatmaps',
                    enabled: true
                  }
                ].map(flag => (
                  <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Flag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{flag.name}</div>
                        <div className="text-sm text-muted-foreground">{flag.description}</div>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                          {flag.key}
                        </code>
                      </div>
                    </div>
                    <Switch checked={flag.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Experiment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Experiment</DialogTitle>
            <DialogDescription>
              Set up a new A/B test to optimize your conversion rates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Experiment Name</Label>
                <Input placeholder="e.g., Homepage CTA Test" />
              </div>
              <div>
                <Label>Test ID</Label>
                <Input placeholder="e.g., homepage_cta_v2" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea placeholder="Describe what you're testing and why..." />
            </div>

            <div>
              <Label>Traffic Allocation</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider defaultValue={[50]} max={100} step={5} className="flex-1" />
                <span className="w-12 text-right">50%</span>
              </div>
            </div>

            <div>
              <Label>Variants</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 p-3 border rounded">
                  <Badge variant="outline">Control</Badge>
                  <Input placeholder="Control variant name" className="flex-1" />
                  <span className="text-sm">50%</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded">
                  <Badge variant="secondary">Variant</Badge>
                  <Input placeholder="Test variant name" className="flex-1" />
                  <span className="text-sm">50%</span>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Experiment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experiment Details Dialog */}
      {selectedExperiment && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedExperiment.name}</DialogTitle>
              <DialogDescription>
                Detailed analysis and performance metrics
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Add detailed charts and metrics here */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Detailed experiment analytics would show time series data, segment analysis,
                  statistical calculations, and more granular metrics.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}