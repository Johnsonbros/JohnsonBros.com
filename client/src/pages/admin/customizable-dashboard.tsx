import { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Settings, RotateCcw, Eye, EyeOff, GripHorizontal, Save } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import CapacityGauge from './widgets/CapacityGauge';
import RevenueTracker from './widgets/RevenueTracker';
import JobBoard from './widgets/JobBoard';
import TechnicianStatus from './widgets/TechnicianStatus';
import RecentJobs from './widgets/RecentJobs';
import StatsOverview from './widgets/StatsOverview';

interface WidgetConfig {
  widgetType: string;
  position: number;
  gridLayout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isVisible: boolean;
}

const widgetComponents: Record<string, React.ComponentType<any>> = {
  capacity_gauge: CapacityGauge,
  revenue_tracker: RevenueTracker,
  job_board: JobBoard,
  tech_status: TechnicianStatus,
  recent_jobs: RecentJobs,
  stats_overview: StatsOverview,
};

const widgetNames: Record<string, string> = {
  capacity_gauge: 'Capacity Gauge',
  revenue_tracker: 'Revenue Tracker',
  job_board: 'Job Board',
  tech_status: 'Technician Status',
  recent_jobs: 'Recent Jobs',
  stats_overview: 'Stats Overview',
};

export default function CustomizableDashboard() {
  const { toast } = useToast();
  const [layouts, setLayouts] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [visibilityStates, setVisibilityStates] = useState<Record<string, boolean>>({});

  // Fetch widget configurations
  const { data: widgets, isLoading } = useQuery({
    queryKey: ['/api/v1/admin/dashboard/widgets'],
    queryFn: () => authenticatedFetch('/api/admin/dashboard/widgets'),
    refetchInterval: false,
  });

  // Update layout mutation
  const updateLayoutMutation = useMutation({
    mutationFn: async (layouts: any[]) => {
      return apiRequest('/api/admin/dashboard/widgets/layout', 'PUT', { layouts });
    },
    onSuccess: () => {
      toast({
        title: 'Layout saved',
        description: 'Your dashboard layout has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/dashboard/widgets'] });
      setEditMode(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save layout. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ widgetType, isVisible }: { widgetType: string; isVisible: boolean }) => {
      return apiRequest(`/api/admin/dashboard/widgets/${widgetType}/visibility`, 'PUT', { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/dashboard/widgets'] });
    },
  });

  // Reset to default mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/dashboard/widgets/reset', 'POST', {});
    },
    onSuccess: () => {
      toast({
        title: 'Reset successful',
        description: 'Dashboard has been reset to default layout.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/dashboard/widgets'] });
      setShowSettings(false);
    },
  });

  // Initialize layouts from widget data
  useEffect(() => {
    if (widgets) {
      const gridLayouts = widgets.map((widget: WidgetConfig) => ({
        i: widget.widgetType,
        ...((typeof widget.gridLayout === 'string'
          ? JSON.parse(widget.gridLayout)
          : widget.gridLayout) || { x: 0, y: 0, w: 6, h: 3 }),
      }));
      setLayouts(gridLayouts);

      const visibility: Record<string, boolean> = {};
      widgets.forEach((widget: WidgetConfig) => {
        visibility[widget.widgetType] = widget.isVisible;
      });
      setVisibilityStates(visibility);
    }
  }, [widgets]);

  const handleLayoutChange = (layout: any[]) => {
    if (editMode) {
      setLayouts(layout);
    }
  };

  const saveLayout = () => {
    const updatedLayouts = layouts.map((layout, index) => ({
      widgetType: layout.i,
      position: index,
      gridLayout: {
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
      },
    }));
    updateLayoutMutation.mutate(updatedLayouts);
  };

  const toggleVisibility = (widgetType: string, isVisible: boolean) => {
    setVisibilityStates(prev => ({ ...prev, [widgetType]: isVisible }));
    updateVisibilityMutation.mutate({ widgetType, isVisible });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customizable Dashboard</h1>
        <div className="flex gap-2">
          {editMode && (
            <Button onClick={saveLayout} variant="default">
              <Save className="mr-2 h-4 w-4" />
              Save Layout
            </Button>
          )}
          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? 'destructive' : 'outline'}
          >
            <GripHorizontal className="mr-2 h-4 w-4" />
            {editMode ? 'Cancel Edit' : 'Edit Layout'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                Widget Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => resetMutation.mutate()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {editMode && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Drag widgets to rearrange them. Resize by dragging the corners.
          </p>
        </div>
      )}

      <GridLayout
        className="layout"
        layout={layouts}
        cols={12}
        rowHeight={80}
        width={1200}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        preventCollision={false}
      >
        {layouts.map((layout) => {
          const widgetType = layout.i;
          const Component = widgetComponents[widgetType];
          const isVisible = visibilityStates[widgetType] !== false;

          if (!Component || !isVisible) return null;

          return (
            <div key={widgetType} className={editMode ? 'cursor-move' : ''}>
              <Card className="h-full w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {widgetNames[widgetType] || widgetType}
                    {editMode && (
                      <div className="flex items-center gap-2">
                        {isVisible ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Component />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </GridLayout>

      {/* Widget Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Widget Settings</DialogTitle>
            <DialogDescription>
              Show or hide widgets on your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(widgetNames).map(([key, name]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key}>{name}</Label>
                <Switch
                  id={key}
                  checked={visibilityStates[key] !== false}
                  onCheckedChange={(checked) => toggleVisibility(key, checked)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
