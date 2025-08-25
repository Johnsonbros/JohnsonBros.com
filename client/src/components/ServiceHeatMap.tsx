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

        // Create enhanced heat map effect with multiple layers
        const maxCustomers = Math.max(...heatMapData.map(city => city.count));
        
        heatMapData.forEach(city => {
          const intensity = city.count / maxCustomers;
          const baseRadius = Math.max(3000, intensity * 15000);
          
          // Outer glow effect (largest, most transparent)
          const outerGlow = new google.maps.Circle({
            strokeColor: '#3B82F6',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#93C5FD', // Light blue
            fillOpacity: Math.max(0.03, intensity * 0.15),
            map: map,
            center: { lat: city.lat, lng: city.lng },
            radius: baseRadius * 2.5,
            clickable: false
          });

          // Middle layer (medium opacity)
          const middleLayer = new google.maps.Circle({
            strokeColor: '#3B82F6',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#60A5FA', // Medium blue
            fillOpacity: Math.max(0.08, intensity * 0.25),
            map: map,
            center: { lat: city.lat, lng: city.lng },
            radius: baseRadius * 1.5,
            clickable: false
          });
          
          // Core area (main clickable circle)
          const coreCircle = new google.maps.Circle({
            strokeColor: '#1E40AF', // Dark blue border
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillColor: '#3B82F6', // Main blue
            fillOpacity: Math.max(0.2, intensity * 0.5),
            map: map,
            center: { lat: city.lat, lng: city.lng },
            radius: baseRadius,
            clickable: true
          });

          // Add pulsing effect for high activity areas
          if (intensity > 0.7) {
            const pulseCircle = new google.maps.Circle({
              strokeColor: '#1D4ED8',
              strokeOpacity: 0.6,
              strokeWeight: 2,
              fillColor: '#3B82F6',
              fillOpacity: 0.3,
              map: map,
              center: { lat: city.lat, lng: city.lng },
              radius: baseRadius * 0.8,
              clickable: false
            });
            
            // Animate the pulse effect
            let scale = 1;
            let growing = true;
            setInterval(() => {
              if (growing) {
                scale += 0.05;
                if (scale >= 1.3) growing = false;
              } else {
                scale -= 0.05;
                if (scale <= 1) growing = true;
              }
              pulseCircle.setRadius(baseRadius * 0.8 * scale);
            }, 100);
          }

          // Enhanced info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 16px; font-family: system-ui; min-width: 200px;">
                <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #1f2937;">${city.city}</h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; background: #3B82F6; border-radius: 50%; margin-right: 8px;"></div>
                  <span style="color: #4b5563; font-size: 14px;">${city.count} customers served</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
                  <span style="color: #4b5563; font-size: 14px;">Active service area</span>
                </div>
                <div style="padding: 8px 12px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; text-align: center; margin-top: 8px;">
                  <span style="font-size: 13px; color: #1e40af; font-weight: 600;">Johnson Bros Coverage Zone</span>
                </div>
              </div>
            `,
            position: { lat: city.lat, lng: city.lng }
          });

          coreCircle.addListener('click', () => {
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