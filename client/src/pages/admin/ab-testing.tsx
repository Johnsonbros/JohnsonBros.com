import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  FlaskConical, 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ABTestData {
  id: number;
  testId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  trafficAllocation: number;
  startDate?: string;
  endDate?: string;
  winnerVariantId?: string;
  variants: Array<{
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
      bounceRate?: number;
      revenue: number;
      statisticalSignificance?: number;
    };
    confidence?: number;
  }>;
  metrics?: Array<{
    variantId: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    bounceRate: number;
    revenue: number;
    statisticalSignificance?: number;
  }>;
}

export default function ABTestingDashboard() {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    testId: '',
    description: '',
    trafficAllocation: 50,
    controlName: 'Control',
    controlWeight: 50,
    variantName: 'Variant B',
    variantWeight: 50
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all A/B tests
  const { data: experiments, isLoading: testsLoading } = useQuery<ABTestData[]>({
    queryKey: ['/api/v1/experiments'],
    queryFn: () => authenticatedFetch('/api/v1/experiments'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch metrics for selected test
  const { data: metrics } = useQuery({
    queryKey: ['/api/v1/ab-tests', selectedTestId, 'metrics'],
    queryFn: () => authenticatedFetch(`/api/v1/ab-tests/${selectedTestId}/metrics`),
    enabled: !!selectedTestId,
    refetchInterval: 30000,
  });

  // Update test status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ testId, status }: { testId: string; status: string }) =>
      authenticatedFetch(`/api/v1/ab-tests/${testId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/experiments'] });
      toast({ title: 'Test status updated successfully' });
    }
  });

  const tests = useMemo(() => {
    if (!experiments) return [];
    return experiments.map(test => ({
      ...test,
      metrics: test.variants.map(variant => ({
        variantId: variant.variantId,
        impressions: variant.metrics?.impressions ?? 0,
        conversions: variant.metrics?.conversions ?? 0,
        conversionRate: variant.metrics?.conversionRate ?? 0,
        bounceRate: variant.metrics?.bounceRate ?? 0,
        revenue: variant.metrics?.revenue ?? 0,
        statisticalSignificance: variant.confidence ?? variant.metrics?.statisticalSignificance
      }))
    }));
  }, [experiments]);

  const activeTests = tests.filter(t => t.status === 'active');
  const completedTests = tests.filter(t => t.status === 'completed');

  const selectedTest = tests?.find(t => t.testId === selectedTestId);
  const selectedMetrics = metrics ?? selectedTest?.metrics ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSignificanceColor = (significance?: number) => {
    if (!significance) return 'text-gray-500';
    if (significance >= 95) return 'text-green-600';
    if (significance >= 90) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getSignificanceBadge = (significance?: number) => {
    if (!significance) return null;
    if (significance >= 99) return <Badge className="bg-green-500">99% Significant</Badge>;
    if (significance >= 95) return <Badge className="bg-green-400">95% Significant</Badge>;
    if (significance >= 90) return <Badge className="bg-yellow-500">90% Significant</Badge>;
    return <Badge variant="outline">Not Significant</Badge>;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const createExperimentMutation = useMutation({
    mutationFn: (payload: { test: Record<string, any>; variants: Record<string, any>[] }) =>
      authenticatedFetch('/api/v1/experiments', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/experiments'] });
      toast({ title: 'Experiment created', description: 'Your new A/B test is ready as a draft.' });
      setShowCreateDialog(false);
      setNewTest({
        name: '',
        testId: '',
        description: '',
        trafficAllocation: 50,
        controlName: 'Control',
        controlWeight: 50,
        variantName: 'Variant B',
        variantWeight: 50
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Failed to create experiment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    }
  });

  const slugifyId = (value: string, fallback: string) => {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || fallback;
  };

  const handleCreateExperiment = () => {
    const name = newTest.name.trim();
    const description = newTest.description.trim();
    const trafficAllocation = Math.min(Math.max(newTest.trafficAllocation, 1), 100);
    let testId = newTest.testId.trim();

    if (!name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    if (!testId) {
      testId = slugifyId(name, 'ab-test');
    }

    const controlName = newTest.controlName.trim();
    const variantName = newTest.variantName.trim();

    if (!controlName || !variantName) {
      toast({ title: 'Variant names are required', variant: 'destructive' });
      return;
    }

    const controlWeight = Math.max(newTest.controlWeight, 1);
    const variantWeight = Math.max(newTest.variantWeight, 1);

    if (controlWeight + variantWeight !== 100) {
      toast({ title: 'Variant weights must total 100%', variant: 'destructive' });
      return;
    }

    let controlId = slugifyId(controlName, 'control');
    let variantId = slugifyId(variantName, 'variant');
    if (variantId === controlId) {
      variantId = `${variantId}_b`;
    }

    createExperimentMutation.mutate({
      test: {
        testId,
        name,
        description: description || undefined,
        trafficAllocation: trafficAllocation / 100
      },
      variants: [
        {
          variantId: controlId,
          name: controlName,
          weight: controlWeight,
          isControl: true,
          changes: {}
        },
        {
          variantId,
          name: variantName,
          weight: variantWeight,
          isControl: false,
          changes: {}
        }
      ]
    });
  };

  const exportResultsToCSV = () => {
    if (!tests || tests.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no A/B tests to export.',
        variant: 'destructive'
      });
      return;
    }

    // Create CSV header
    const headers = [
      'Test Name',
      'Status',
      'Variant Name',
      'Is Control',
      'Impressions',
      'Conversions',
      'Conversion Rate',
      'Revenue',
      'Statistical Significance',
      'Traffic Allocation',
      'Start Date',
      'End Date'
    ];

    // Create CSV rows
    const rows: string[][] = [];
    tests.forEach(test => {
      test.variants.forEach(variant => {
        const metric = test.metrics?.find(m => m.variantId === variant.variantId);
        rows.push([
          test.name,
          test.status,
          variant.name,
          variant.isControl ? 'Yes' : 'No',
          (metric?.impressions || 0).toString(),
          (metric?.conversions || 0).toString(),
          formatPercentage(metric?.conversionRate || 0),
          formatCurrency(metric?.revenue || 0),
          metric?.statisticalSignificance ? `${metric.statisticalSignificance}%` : 'N/A',
          `${(test.trafficAllocation * 100).toFixed(0)}%`,
          test.startDate ? new Date(test.startDate).toLocaleDateString() : 'N/A',
          test.endDate ? new Date(test.endDate).toLocaleDateString() : 'N/A'
        ]);
      });
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `ab-test-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export successful',
      description: 'A/B test results have been exported to CSV.'
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your A/B tests</p>
        </div>
        <Button
          variant="outline"
          onClick={exportResultsToCSV}
          data-testid="button-export-results"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTests.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTests.reduce((sum, test) => 
                sum + (test.metrics?.reduce((m, v) => m + v.impressions, 0) || 0), 0
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTests.length > 0 ? 
                formatPercentage(
                  activeTests.reduce((sum, test) => {
                    const testAvg = test.metrics?.reduce((m, v) => m + v.conversionRate, 0) || 0;
                    return sum + (testAvg / (test.metrics?.length || 1));
                  }, 0) / activeTests.length
                ) : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Average rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                activeTests.reduce((sum, test) => 
                  sum + (test.metrics?.reduce((m, v) => m + v.revenue, 0) || 0), 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">From conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Selection and Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>A/B Tests</CardTitle>
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="default"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-new-test"
              >
                New Test
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active ({activeTests.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
              <TabsTrigger value="all">All Tests ({tests?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeTests.map(test => (
                <div
                  key={test.testId}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer hover:bg-gray-50",
                    selectedTestId === test.testId && "bg-blue-50 border-blue-300"
                  )}
                  onClick={() => setSelectedTestId(test.testId)}
                  data-testid={`test-card-${test.testId}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{test.name}</h3>
                        <Badge className={getStatusColor(test.status)}>
                          {getStatusIcon(test.status)}
                          <span className="ml-1">{test.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {test.variants.length} variants
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started {test.startDate ? new Date(test.startDate).toLocaleDateString() : 'N/A'}
                        </span>
                        <span>
                          Traffic: {(test.trafficAllocation * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {test.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ testId: test.testId, status: 'paused' });
                          }}
                          data-testid={`button-pause-${test.testId}`}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {test.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ testId: test.testId, status: 'active' });
                          }}
                          data-testid={`button-resume-${test.testId}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedTests.map(test => (
                <div
                  key={test.testId}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedTestId(test.testId)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.description}</p>
                      {test.winnerVariantId && (
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          Winner: {test.variants.find(v => v.variantId === test.winnerVariantId)?.name}
                        </Badge>
                      )}
                    </div>
                    <Badge className={getStatusColor(test.status)}>
                      {getStatusIcon(test.status)}
                      <span className="ml-1">{test.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {tests?.map(test => (
                <div
                  key={test.testId}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedTestId(test.testId)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                    <Badge className={getStatusColor(test.status)}>
                      {getStatusIcon(test.status)}
                      <span className="ml-1">{test.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Details and Metrics */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedTest.name}</CardTitle>
                <CardDescription>{selectedTest.description}</CardDescription>
              </div>
              {selectedMetrics.length > 0 && (
                <div className="text-right">
                  {getSignificanceBadge(
                    Math.max(...selectedMetrics.map(m => m.statisticalSignificance || 0))
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variant Performance Table */}
            <div>
              <h3 className="font-semibold mb-4">Variant Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Variant</th>
                      <th className="text-right p-2">Impressions</th>
                      <th className="text-right p-2">Conversions</th>
                      <th className="text-right p-2">Conversion Rate</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Significance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTest.variants.map(variant => {
                      const metric = selectedMetrics.find(m => m.variantId === variant.variantId);
                      return (
                        <tr key={variant.variantId} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {variant.name}
                              {variant.isControl && <Badge variant="outline">Control</Badge>}
                            </div>
                          </td>
                          <td className="text-right p-2">{metric?.impressions.toLocaleString() || 0}</td>
                          <td className="text-right p-2">{metric?.conversions.toLocaleString() || 0}</td>
                          <td className="text-right p-2">
                            {metric ? formatPercentage(metric.conversionRate) : '0%'}
                          </td>
                          <td className="text-right p-2">
                            {metric ? formatCurrency(metric.revenue) : '$0.00'}
                          </td>
                          <td className={cn("text-right p-2", getSignificanceColor(metric?.statisticalSignificance))}>
                            {metric?.statisticalSignificance ? `${metric.statisticalSignificance}%` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conversion Rate Chart */}
            {selectedMetrics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Conversion Rate Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selectedTest.variants.map(variant => {
                    const metric = selectedMetrics.find(m => m.variantId === variant.variantId);
                    return {
                      name: variant.name,
                      conversionRate: metric ? metric.conversionRate * 100 : 0,
                      isControl: variant.isControl
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Bar 
                      dataKey="conversionRate" 
                      fill="#82ca9d"
                      name="Conversion Rate (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New A/B Test</DialogTitle>
            <DialogDescription>
              Set up a draft experiment and start it when you are ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ab-test-name">Test name</Label>
                <Input
                  id="ab-test-name"
                  value={newTest.name}
                  onChange={(event) => setNewTest({ ...newTest, name: event.target.value })}
                  placeholder="Homepage CTA copy test"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ab-test-id">Test ID</Label>
                <Input
                  id="ab-test-id"
                  value={newTest.testId}
                  onChange={(event) => setNewTest({ ...newTest, testId: event.target.value })}
                  placeholder="homepage_cta_copy"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ab-test-description">Description</Label>
              <Textarea
                id="ab-test-description"
                value={newTest.description}
                onChange={(event) => setNewTest({ ...newTest, description: event.target.value })}
                placeholder="Describe what success looks like for this experiment."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ab-test-traffic">Traffic allocation (%)</Label>
                <Input
                  id="ab-test-traffic"
                  type="number"
                  min={1}
                  max={100}
                  value={newTest.trafficAllocation}
                  onChange={(event) => setNewTest({ ...newTest, trafficAllocation: Number(event.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <span className="text-xs text-muted-foreground">Weights must total 100%</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="ab-test-control">Control name</Label>
                  <Input
                    id="ab-test-control"
                    value={newTest.controlName}
                    onChange={(event) => setNewTest({ ...newTest, controlName: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ab-test-control-weight">Weight (%)</Label>
                  <Input
                    id="ab-test-control-weight"
                    type="number"
                    min={1}
                    max={100}
                    value={newTest.controlWeight}
                    onChange={(event) => setNewTest({ ...newTest, controlWeight: Number(event.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="ab-test-variant">Variant name</Label>
                  <Input
                    id="ab-test-variant"
                    value={newTest.variantName}
                    onChange={(event) => setNewTest({ ...newTest, variantName: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ab-test-variant-weight">Weight (%)</Label>
                  <Input
                    id="ab-test-variant-weight"
                    type="number"
                    min={1}
                    max={100}
                    value={newTest.variantWeight}
                    onChange={(event) => setNewTest({ ...newTest, variantWeight: Number(event.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExperiment} disabled={createExperimentMutation.isPending}>
              {createExperimentMutation.isPending ? 'Creating…' : 'Create Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
