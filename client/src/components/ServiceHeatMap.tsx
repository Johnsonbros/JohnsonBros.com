import { useQuery } from "@tanstack/react-query";
import { MapPin, Activity } from "lucide-react";
import { useEffect, useRef } from "react";
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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  
  const { data: heatMapData, isLoading } = useQuery<HeatMapData[]>({
    queryKey: ['/api/social-proof/service-heat-map'],
  });

  useEffect(() => {
    if (!heatMapData || heatMapData.length === 0 || !mapRef.current) return;

    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
        libraries: ["geometry"]
      });

      try {
        const google = await loader.load();
        
        // Center map on Massachusetts
        const map = new google.maps.Map(mapRef.current!, {
          zoom: 9,
          center: { lat: 42.3601, lng: -71.0589 }, // Boston center
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Create custom heat map effect with circles
        const maxCustomers = Math.max(...heatMapData.map(city => city.count));
        
        heatMapData.forEach(city => {
          const intensity = city.count / maxCustomers;
          const radius = Math.max(5000, intensity * 25000); // Radius in meters
          
          // Create glowing circle for customer density
          const circle = new google.maps.Circle({
            strokeColor: '#3B82F6', // Blue color
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#3B82F6',
            fillOpacity: Math.max(0.1, intensity * 0.6), // Brighter where more customers
            map: map,
            center: { lat: city.lat, lng: city.lng },
            radius: radius,
            clickable: true
          });

          // Add glow effect with larger, more transparent circle
          const glowCircle = new google.maps.Circle({
            strokeColor: '#60A5FA',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#60A5FA',
            fillOpacity: Math.max(0.05, intensity * 0.3),
            map: map,
            center: { lat: city.lat, lng: city.lng },
            radius: radius * 1.8,
            clickable: false
          });

          // Add info window for click interaction
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; font-family: system-ui;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">${city.city}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${city.count} customers served</p>
                <div style="margin-top: 8px; padding: 4px 8px; background: #dbeafe; border-radius: 4px; font-size: 12px; color: #1e40af; display: inline-block;">
                  Service Area
                </div>
              </div>
            `,
            position: { lat: city.lat, lng: city.lng }
          });

          circle.addListener('click', () => {
            infoWindow.open(map);
          });
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto" data-testid="service-heat-map">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Massachusetts Service Coverage</h3>
          </div>
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-green-500 mr-2 animate-pulse" />
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-80 w-full"
          data-testid="google-map-container"
        />

        {/* Service Stats Overlay - Bottom Center */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 min-w-80">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="cities-served">
                  {heatMapData.length}
                </div>
                <div className="text-xs text-gray-600">Cities Served</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="total-jobs">
                  {heatMapData.reduce((sum, city) => sum + city.count, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600" data-testid="most-active">
                  {Math.max(...heatMapData.map(city => city.count))}
                </div>
                <div className="text-xs text-gray-600">Most Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="avg-rating">5.0★</div>
                <div className="text-xs text-gray-600">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1.5"></div>
            <span className="text-gray-700">High Activity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1.5"></div>
            <span className="text-gray-700">Medium Activity (10-19 jobs)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1.5"></div>
            <span className="text-gray-700">Regular Service (1-9 jobs)</span>
          </div>
        </div>
      </div>
    </div>
  );
}