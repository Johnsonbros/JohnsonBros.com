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
        // Create a soft, cloud-like effect similar to the original
        const heatmapData: any[] = [];
        const maxCount = Math.max(...heatMapData.map(city => city.count));
        
        heatMapData.forEach(city => {
          // Create fewer but more weighted points for softer effect
          const basePoints = Math.max(3, Math.round((city.count / maxCount) * 15));
          const weight = city.count / maxCount;
          
          // Add core points with weight
          for (let i = 0; i < basePoints; i++) {
            const angle = (i / basePoints) * 2 * Math.PI;
            const radius = Math.random() * 0.03 * (1 - weight * 0.5); // Tighter for higher weight areas
            
            heatmapData.push({
              location: new google.maps.LatLng(
                city.lat + radius * Math.cos(angle),
                city.lng + radius * Math.sin(angle)
              ),
              weight: weight * 2 // Double weight for intensity
            });
          }
          
          // Add surrounding softer points for cloud effect
          for (let i = 0; i < basePoints * 2; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 0.05;
            
            heatmapData.push({
              location: new google.maps.LatLng(
                city.lat + distance * Math.cos(angle),
                city.lng + distance * Math.sin(angle)
              ),
              weight: weight * 0.5
            });
          }
        });

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

        // Create the heat map layer with soft, cloud-like settings
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: map,
          radius: 60, // Larger radius for softer effect
          opacity: 0.6, // Lower opacity for softer appearance
          gradient: customGradient,
          maxIntensity: 3, // Lower intensity for more spread
          dissipating: true
        });

        heatmapRef.current = heatmap;

        // Add subtle markers for top service areas
        const topCities = [...heatMapData].sort((a, b) => b.count - a.count).slice(0, 3); // Show only top 3
        
        topCities.forEach((city, index) => {
          const marker = new google.maps.Marker({
            position: { lat: city.lat, lng: city.lng },
            map: map,
            title: city.city,
            visible: false // Hide markers by default, only show on click
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

          // Show info window on map click near the marker
          map.addListener('click', (event: any) => {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              event.latLng,
              new google.maps.LatLng(city.lat, city.lng)
            );
            if (distance < 5000) { // Within 5km
              infoWindow.open(map);
              infoWindow.setPosition(event.latLng);
            }
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

      </div>
    </div>
  );
}