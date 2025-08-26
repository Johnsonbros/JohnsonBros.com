import { useQuery } from "@tanstack/react-query";
import { MapPin, Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

/// <reference types="@types/google.maps" />

interface HeatMapData {
  city: string;
  count: number;
  lat: number;
  lng: number;
  intensity: number;
}

export function ServiceHeatMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [currentGradient, setCurrentGradient] = useState<'default' | 'custom'>('custom');
  
  const { data: heatMapData, isLoading } = useQuery<HeatMapData[]>({
    queryKey: ['/api/social-proof/service-heat-map'],
  });

  useEffect(() => {
    if (!heatMapData || heatMapData.length === 0 || !mapRef.current) return;

    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
        libraries: ["visualization", "geometry"]
      });

      try {
        const google = await loader.load();
        
        // Mobile-optimized map settings
        const isMobile = window.innerWidth <= 768;
        const map = new google.maps.Map(mapRef.current!, {
          zoom: isMobile ? 8 : 9, // Wider view on mobile
          center: { lat: 42.2, lng: -70.95 }, // Center on South Shore area
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          minZoom: 7, // Wider minimum zoom for mobile
          maxZoom: 11, // Limit zoom for privacy and performance
          clickableIcons: false, // Disable POI clicks completely
          disableDefaultUI: false,
          gestureHandling: 'greedy', // Better mobile touch handling
          styles: [
            {
              featureType: "poi",
              elementType: "all",
              stylers: [{ visibility: "off" }] // Hide all POIs
            },
            {
              featureType: "poi.business",
              elementType: "all",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit",
              elementType: "all", 
              stylers: [{ visibility: "off" }] // Hide transit stations
            }
          ],
          mapTypeControl: false, // Hide on mobile for cleaner UI
          zoomControl: true,
          zoomControlOptions: {
            position: isMobile ? 
              google.maps.ControlPosition.RIGHT_BOTTOM : 
              google.maps.ControlPosition.RIGHT_CENTER
          },
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
          },
          restriction: {
            // Restrict map bounds to Massachusetts area
            latLngBounds: {
              north: 42.9,
              south: 41.2,
              west: -73.5,
              east: -69.9
            }
          }
        });

        mapInstanceRef.current = map;

        // Use individual job locations as heat map points
        // Each point represents an actual job location (with privacy offset applied on backend)
        const heatmapData: any[] = heatMapData.map(location => ({
          location: new google.maps.LatLng(location.lat, location.lng),
          weight: location.intensity || 1 // Use consistent weight for trust signal
        }));

        // Soft blue gradient matching the original's cloud-like appearance
        const customGradient = [
          'rgba(0, 0, 0, 0)',
          'rgba(200, 230, 255, 0.1)',
          'rgba(150, 210, 255, 0.3)',
          'rgba(100, 180, 255, 0.5)',
          'rgba(80, 160, 255, 0.6)',
          'rgba(60, 140, 255, 0.7)',
          'rgba(40, 120, 255, 0.8)',
          'rgba(30, 100, 255, 0.85)',
          'rgba(20, 80, 255, 0.9)',
          'rgba(10, 60, 255, 0.95)',
          'rgba(0, 40, 255, 1)',
          'rgba(0, 30, 230, 1)',
          'rgba(0, 20, 200, 1)',
          'rgba(0, 10, 180, 1)'
        ];

        // Mobile-optimized heat map settings
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: map,
          radius: isMobile ? 40 : 35, // Larger radius on mobile for better visibility
          opacity: 0.75, // Slightly higher opacity for mobile screens
          gradient: customGradient,
          maxIntensity: isMobile ? 3 : 2, // Adjust intensity for mobile
          dissipating: true
        });

        heatmapRef.current = heatmap;

        // No markers for privacy - the heat map alone shows coverage as trust signal

      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initializeMap();
  }, [heatMapData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Service Coverage Map</h3>
          </div>
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-green-500 mr-2 animate-pulse" />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!heatMapData || heatMapData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Service Coverage Map</h3>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Service coverage data coming soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full" data-testid="service-heat-map">
      {/* Mobile-optimized header */}
      <div className="text-center py-4 md:py-6 px-3 md:px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
          Where Do We Work? Lets see.....
        </h2>
        <p className="text-sm text-gray-600 md:hidden">Tap map to explore our service areas</p>
      </div>

      {/* Mobile-optimized map container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-[400px] sm:h-[450px] md:h-[500px] w-full"
          data-testid="google-map-container"
          style={{ touchAction: 'none' }} // Better mobile touch handling
        />

        {/* Mobile-optimized floating badge */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
          <div className="bg-white/90 backdrop-blur rounded-full p-1.5 md:p-2 shadow-lg border border-gray-200">
            <Activity className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </div>
        </div>

        {/* Mobile coverage stats */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10">
          <div className="bg-white/90 backdrop-blur rounded-lg px-2 py-1 md:px-3 md:py-2 shadow-lg border border-gray-200">
            <span className="text-xs md:text-sm font-medium text-gray-700">
              {heatMapData ? `${heatMapData.length} Service Areas` : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}