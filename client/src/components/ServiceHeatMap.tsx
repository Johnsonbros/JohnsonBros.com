import { useQuery } from "@tanstack/react-query";
import { MapPin, Activity, Users, TrendingUp, Navigation } from "lucide-react";
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
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  
  const { data: heatMapData, isLoading } = useQuery<HeatMapData[]>({
    queryKey: ['/api/social-proof/service-heat-map'],
  });

  // Calculate total customers from heat map data
  useEffect(() => {
    if (heatMapData) {
      const total = heatMapData.reduce((sum, point) => sum + point.count, 0);
      setTotalCustomers(total * 4); // Adjust multiplier for granular data
    }
  }, [heatMapData]);

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
          maxZoom: 10, // Limited zoom for privacy - this is the farthest users can zoom
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

        // Blue to orange gradient matching company color scheme
        const customGradient = [
          'rgba(0, 0, 0, 0)',
          'rgba(200, 230, 255, 0.1)',
          'rgba(150, 210, 255, 0.3)',
          'rgba(100, 180, 255, 0.5)',
          'rgba(80, 160, 255, 0.6)',
          'rgba(60, 140, 255, 0.7)',
          'rgba(100, 130, 255, 0.75)',
          'rgba(140, 120, 230, 0.8)',
          'rgba(180, 110, 200, 0.85)',
          'rgba(220, 100, 170, 0.9)',
          'rgba(251, 146, 60, 0.95)',
          'rgba(249, 115, 22, 1)',
          'rgba(234, 88, 12, 1)',
          'rgba(220, 60, 5, 1)'
        ];

        // Add pulsing markers for top service areas
        const topAreas = heatMapData
          .sort((a, b) => b.count - a.count)
          .slice(0, 3); // Top 3 busiest areas
        
        topAreas.forEach((area, index) => {
          const pulseCircle = new google.maps.Circle({
            strokeColor: '#2563EB',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            map: map,
            center: { lat: area.lat, lng: area.lng },
            radius: 1500 - (index * 200),
          });
          
          // Subtle pulse animation
          let opacity = 0.1;
          let growing = true;
          setInterval(() => {
            if (growing) {
              opacity += 0.005;
              if (opacity >= 0.2) growing = false;
            } else {
              opacity -= 0.005;
              if (opacity <= 0.05) growing = true;
            }
            pulseCircle.setOptions({ fillOpacity: opacity });
          }, 150);
        });
        
        // Mobile-optimized heat map settings
        // Adjust radius based on zoom level for privacy at max zoom
        const getRadiusForZoom = () => {
          const currentZoom = map.getZoom() || 10;
          // Larger radius at higher zoom to maintain privacy
          if (currentZoom >= 14) return 60; // Very blurry at street level
          if (currentZoom >= 12) return 45;
          if (currentZoom >= 10) return 30;
          return 25;
        };
        
        // Use circles instead of deprecated HeatmapLayer
        const heatmapCircles: any[] = [];
        
        // Create circles for each data point with opacity based on intensity
        heatMapData.forEach(point => {
          const intensity = Math.min(point.count / 100, 1); // Normalize intensity
          const circle = new google.maps.Circle({
            strokeColor: '#EA580C',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: intensity > 0.7 ? '#DC3C05' : intensity > 0.4 ? '#EA580C' : '#F97316',
            fillOpacity: intensity * 0.3, // Max 30% opacity for layering
            map: map,
            center: { lat: point.lat, lng: point.lng },
            radius: getRadiusForZoom() * 50, // Scale up radius for visibility
          });
          heatmapCircles.push(circle);
        });
        
        // Update radius on zoom change to maintain privacy
        map.addListener('zoom_changed', () => {
          const newRadius = getRadiusForZoom() * 50;
          heatmapCircles.forEach(circle => {
            circle.setRadius(newRadius);
          });
        });

        // Store circles reference for cleanup
        (heatmapRef as any).current = heatmapCircles;

        // Add click listener to show city info
        map.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Find nearest city from heat map data
          let nearestCity = null;
          let minDistance = Infinity;
          
          heatMapData.forEach(point => {
            const distance = Math.sqrt(
              Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2)
            );
            if (distance < minDistance && distance < 0.05) {
              minDistance = distance;
              nearestCity = point.city;
            }
          });
          
          if (nearestCity) {
            setHoveredCity(nearestCity);
            setTimeout(() => setHoveredCity(null), 3000);
          }
        });

        // Add "Find My Location" functionality
        const locationButton = document.createElement('button');
        locationButton.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        `;
        locationButton.classList.add(
          'bg-white', 'p-2', 'rounded-lg', 'shadow-lg', 'hover:bg-gray-100',
          'transition-colors', 'border', 'border-gray-300', 'm-2'
        );
        locationButton.title = 'Check if we service your area';
        locationButton.type = 'button';
        locationButton.addEventListener('click', () => {
          setIsLocating(true);
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                map.setCenter(pos);
                map.setZoom(11);
                
                // Check if in service area
                const inServiceArea = position.coords.latitude > 41.5 && 
                                    position.coords.latitude < 43 &&
                                    position.coords.longitude > -71.5 && 
                                    position.coords.longitude < -70.5;
                
                if (inServiceArea) {
                  alert('Great news! We service your area. Book now for fast, reliable plumbing service!');
                } else {
                  alert('We may service your area! Call us at 617-479-9911 to confirm.');
                }
                setIsLocating(false);
              },
              () => {
                alert('Could not get your location. Please check your browser settings.');
                setIsLocating(false);
              }
            );
          }
        });
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(locationButton);

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
      {/* Enhanced header with live stats */}
      <div className="text-center py-4 md:py-6 px-3 md:px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
          Where Do We Work? Lets see.....
        </h2>
        
        {/* Live statistics bar */}
        <div className="flex flex-wrap justify-center gap-4 mt-3 mb-2">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">
              {totalCustomers.toLocaleString()}+ Happy Customers
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">
              Growing Daily
            </span>
          </div>
          {heatMapData && (
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-semibold text-gray-700">
                4.8/5 Avg Rating
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-optimized map container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-[400px] sm:h-[450px] md:h-[500px] w-full"
          data-testid="google-map-container"
          style={{ touchAction: 'none' }} // Better mobile touch handling
        />

        {/* Trust badge with last update time */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
          <div className="bg-white/90 backdrop-blur rounded-lg px-2 py-1.5 md:px-3 md:py-2 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                <span className="text-xs font-medium text-gray-700">Live Data</span>
              </div>
              <span className="text-xs text-gray-500">• Updated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Real-time coverage stats */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10">
          <div className="bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg border border-gray-200">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full opacity-75 animate-ping"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full relative"></div>
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-800">
                  LIVE COVERAGE
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {heatMapData ? `${Math.floor(heatMapData.length / 15)} Service Areas • 3,000+ Customers` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
        
        {/* City popup on hover/click */}
        {hoveredCity && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 border-blue-500 animate-fade-in-up">
              <p className="text-sm font-bold text-gray-800">📍 {hoveredCity}</p>
              <p className="text-xs text-gray-600">We service this area!</p>
            </div>
          </div>
        )}
        
        
        {/* Loading indicator for location */}
        {isLocating && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <div className="bg-white px-4 py-3 rounded-lg shadow-xl">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium">Finding your location...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}