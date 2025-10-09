import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, RefreshCw, Download, Activity, Users, TrendingUp } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminHeatMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch heat map data
  const { data: heatMapData } = useQuery<{ dataPoints: Array<{ lat: number; lng: number; intensity: number }>, count: number }>({
    queryKey: ['/api/admin/heatmap/data'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch statistics
  const { data: stats } = useQuery<{
    totalJobs: number;
    jobsLast30Days: number;
    citiesCovered: number;
    activeDataPoints: number;
  }>({
    queryKey: ['/api/admin/heatmap/stats'],
    refetchInterval: 30000,
  });

  // Import historical data mutation
  const importMutation = useMutation({
    mutationFn: async (startDate: string) => {
      return await apiRequest('/api/admin/heatmap/import', {
        method: 'POST',
        body: JSON.stringify({ startDate }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Import Complete',
        description: 'Historical job data has been imported successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/heatmap/data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/heatmap/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate snapshot mutation
  const snapshotMutation = useMutation({
    mutationFn: async () => {
      // Capture the map as an image (simplified - in production use html2canvas or similar)
      const imageUrl = `/assets/heatmap-snapshot-${Date.now()}.png`;
      
      return await apiRequest('/api/admin/heatmap/snapshot', {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Snapshot Generated',
        description: 'Heat map snapshot has been saved for public display',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Snapshot Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update intensities mutation
  const updateIntensitiesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/heatmap/update-intensities', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Intensities Updated',
        description: 'Job intensities have been recalculated based on age',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/heatmap/data'] });
    },
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !heatMapData?.dataPoints || heatMapData.dataPoints.length === 0) return;

    const initializeMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not configured');
        setIsLoading(false);
        return;
      }

      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['visualization'],
      });

      try {
        const google = await loader.load();
        
        // Create map
        const map = new google.maps.Map(mapRef.current!, {
          zoom: 10,
          center: { lat: 42.2, lng: -70.95 }, // South Shore area
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'all',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Create heat map points
        const heatMapPoints = heatMapData.dataPoints.map((point) => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          weight: point.intensity,
        }));

        // Create heat map layer
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatMapPoints,
          map: map,
          radius: 25,
          opacity: 0.7,
          gradient: [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)',
          ],
        });

        heatmapLayerRef.current = heatmap;
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [heatMapData]);

  // Update heat map when data changes
  useEffect(() => {
    if (!heatmapLayerRef.current || !heatMapData?.dataPoints) return;

    const google = (window as any).google;
    if (!google) return;

    const heatMapPoints = heatMapData.dataPoints.map((point) => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.intensity,
    }));

    heatmapLayerRef.current.setData(heatMapPoints);
  }, [heatMapData]);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-heatmap-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Heat Map</h1>
          <p className="text-muted-foreground mt-1">
            Real-time visualization of service coverage based on customer locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => importMutation.mutate('2022-01-01')}
            disabled={importMutation.isPending}
            data-testid="button-import-historical"
          >
            <Download className="h-4 w-4 mr-2" />
            {importMutation.isPending ? 'Importing...' : 'Import Historical'}
          </Button>
          <Button
            variant="outline"
            onClick={() => updateIntensitiesMutation.mutate()}
            disabled={updateIntensitiesMutation.isPending}
            data-testid="button-update-intensities"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Intensities
          </Button>
          <Button
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
            data-testid="button-generate-snapshot"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {snapshotMutation.isPending ? 'Generating...' : 'Generate Snapshot'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-jobs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{stats?.totalJobs?.toLocaleString() || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-recent-jobs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold">{stats?.jobsLast30Days?.toLocaleString() || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-cities-covered">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cities Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              <div className="text-2xl font-bold">{stats?.citiesCovered?.toLocaleString() || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-active-points">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div className="text-2xl font-bold">{stats?.activeDataPoints?.toLocaleString() || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heat Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Heat Map</CardTitle>
          <CardDescription>
            Real-time visualization updates every 30 seconds. Red areas indicate high service density.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading heat map...</p>
                </div>
              </div>
            )}
            <div
              ref={mapRef}
              className="w-full h-[600px] rounded-lg border"
              data-testid="heatmap-container"
            />
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-500 rounded" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>High</span>
              </div>
            </div>
            <div>
              {heatMapData?.count || 0} data points displayed
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
