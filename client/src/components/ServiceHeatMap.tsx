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
        
        // Center map on Massachusetts with a street view for trust signal
        const map = new google.maps.Map(mapRef.current!, {
          zoom: 10,
          center: { lat: 42.3601, lng: -71.0589 }, // Boston center
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi.business",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          streetViewControl: false,
          fullscreenControl: false
        });

        mapInstanceRef.current = map;

        // Generate weighted heat map data points
        // Create multiple points per city based on customer count for better density visualization
        const heatmapData: any[] = [];
        const maxCount = Math.max(...heatMapData.map(city => city.count));
        
        heatMapData.forEach(city => {
          // Add weighted points - more customers = more points in that area
          const pointCount = Math.max(1, Math.round((city.count / maxCount) * 35));
          
          for (let i = 0; i < pointCount; i++) {
            // Add some random variation to create a more natural heat map
            // Use Gaussian distribution for more realistic clustering
            const gaussianRandom = () => {
              let u = 0, v = 0;
              while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
              while(v === 0) v = Math.random();
              return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
            };
            
            // Smaller variation for denser clustering (about 500m spread)
            const latVariation = gaussianRandom() * 0.008;
            const lngVariation = gaussianRandom() * 0.008;
            
            heatmapData.push(
              new google.maps.LatLng(
                city.lat + latVariation,
                city.lng + lngVariation
              )
            );
          }
        });

        // Custom gradient matching the original design - blue gradient only
        const customGradient = [
          'rgba(0, 0, 0, 0)',
          'rgba(102, 225, 255, 0.2)',
          'rgba(102, 200, 255, 0.4)',
          'rgba(70, 150, 255, 0.6)',
          'rgba(50, 120, 255, 0.8)',
          'rgba(30, 90, 255, 0.9)',
          'rgba(20, 70, 255, 1)',
          'rgba(10, 50, 255, 1)',
          'rgba(0, 30, 255, 1)',
          'rgba(0, 20, 200, 1)',
          'rgba(0, 10, 150, 1)',
          'rgba(0, 5, 120, 1)',
          'rgba(0, 0, 100, 1)',
          'rgba(0, 0, 80, 1)'
        ];

        // Create the heat map layer with settings matching the original
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: map,
          radius: 40,
          opacity: 0.85,
          gradient: customGradient,
          maxIntensity: 8,
          dissipating: true
        });

        heatmapRef.current = heatmap;

        // Add markers for top service areas with info windows
        const topCities = [...heatMapData].sort((a, b) => b.count - a.count).slice(0, 5);
        
        topCities.forEach((city, index) => {
          const marker = new google.maps.Marker({
            position: { lat: city.lat, lng: city.lng },
            map: map,
            title: city.city,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: index === 0 ? '#FFD700' : '#3B82F6',
              fillOpacity: 0.6,
              strokeColor: '#FFFFFF',
              strokeWeight: 1.5
            },
            animation: index === 0 ? google.maps.Animation.BOUNCE : undefined
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 16px; font-family: system-ui; min-width: 250px;">
                <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #1f2937;">
                  ${city.city} ${index === 0 ? '🏆' : ''}
                </h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; background: ${index === 0 ? '#EF4444' : '#3B82F6'}; border-radius: 50%; margin-right: 8px;"></div>
                  <span style="color: #4b5563; font-size: 14px; font-weight: 600;">${city.count} jobs completed</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 12px; height: 12px; background: #10B981; border-radius: 50%; margin-right: 8px;"></div>
                  <span style="color: #4b5563; font-size: 14px;">Active service area</span>
                </div>
                <div style="padding: 8px 12px; background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 8px; text-align: center; margin-top: 8px;">
                  <span style="font-size: 13px; color: #1E40AF; font-weight: 600;">
                    ${index === 0 ? 'Top Service Area' : `#${index + 1} Service Area`}
                  </span>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
                  <div style="font-size: 12px; color: #6B7280;">
                    ⭐⭐⭐⭐⭐ 5.0 Rating
                  </div>
                  <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">
                    Trusted by your neighbors
                  </div>
                </div>
              </div>
            `,
            position: { lat: city.lat, lng: city.lng }
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          // Auto-open the top city's info window
          if (index === 0) {
            setTimeout(() => {
              infoWindow.open(map, marker);
            }, 1500);
          }
        });

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
    <div className="bg-white w-full max-w-5xl mx-auto" data-testid="service-heat-map">
      {/* Header - matches your site style */}
      <div className="text-center py-6 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Where Do We Work? Lets see.....
        </h2>
      </div>

      {/* Google Maps Container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-96 md:h-[500px] w-full"
          data-testid="google-map-container"
        />

        {/* Floating info button - top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white rounded-full p-2 shadow-lg border border-gray-200">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {/* Bottom stats bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/20 to-transparent">
          <div className="p-4">
            <div className="bg-white rounded-xl p-3 shadow-lg mx-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600" data-testid="cities-served">
                      {heatMapData.length}
                    </div>
                    <div className="text-xs text-gray-600">Cities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600" data-testid="total-jobs">
                      {heatMapData.reduce((sum, city) => sum + city.count, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Jobs</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600" data-testid="most-active">
                      {Math.max(...heatMapData.map(city => city.count))}
                    </div>
                    <div className="text-xs text-gray-600">Peak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600" data-testid="avg-rating">5.0★</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}