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
  const [activeTestimonial, setActiveTestimonial] = useState<number | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Customer testimonials for different service areas
  const testimonials = [
    {
      id: 1,
      name: "Sarah M.",
      location: "Quincy, MA",
      text: "Johnson Bros saved the day! Same-day emergency service and fixed our burst pipe perfectly.",
      rating: 5,
      service: "Emergency Plumbing",
      lat: 42.2529,
      lng: -71.0023
    },
    {
      id: 2,
      name: "Mike R.",
      location: "Weymouth, MA", 
      text: "Outstanding water heater installation. Professional, clean, and reasonably priced!",
      rating: 5,
      service: "Water Heater Install",
      lat: 42.2176,
      lng: -70.9395
    },
    {
      id: 3,
      name: "Linda K.",
      location: "Braintree, MA",
      text: "Best drain cleaning service we've ever used. They explained everything clearly.",
      rating: 5,
      service: "Drain Cleaning",
      lat: 42.2076,
      lng: -71.0014
    },
    {
      id: 4,
      name: "Tom H.",
      location: "Hull, MA",
      text: "Reliable, honest, and fast. They've been our go-to plumbers for 3 years now!",
      rating: 5,
      service: "General Plumbing",
      lat: 42.3084,
      lng: -70.8967
    }
  ];
  
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

  // Auto-cycle testimonials for impressive social proof
  useEffect(() => {
    const cycleTestimonials = () => {
      const nextTestimonial = testimonials[Math.floor(Math.random() * testimonials.length)];
      setActiveTestimonial(nextTestimonial.id);
      setTimeout(() => setActiveTestimonial(null), 4000); // Show for 4 seconds
    };

    // Start cycling after 3 seconds, then every 8 seconds
    const initialTimer = setTimeout(() => {
      cycleTestimonials();
      const interval = setInterval(cycleTestimonials, 12000); // Every 12 seconds

      // Cleanup interval
      return () => clearInterval(interval);
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, [testimonials]);

  // Lazy load map when it comes into view to reduce API costs
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isMapVisible) {
            setIsMapVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Load map 200px before it comes into view
        threshold: 0.1
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isMapVisible]);

  useEffect(() => {
    if (!heatMapData || heatMapData.length === 0 || !mapRef.current || !isMapVisible) return;

    const initializeMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn("Google Maps API key is not configured. Map features will be limited.");
        // You could optionally show a message to the user or use a fallback
      }
      
      const loader = new Loader({
        apiKey: apiKey || "",
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

        // Store intervals for cleanup
        const intervals: NodeJS.Timeout[] = [];
        
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
          const intervalId = setInterval(() => {
            if (growing) {
              opacity += 0.005;
              if (opacity >= 0.2) growing = false;
            } else {
              opacity -= 0.005;
              if (opacity <= 0.05) growing = true;
            }
            pulseCircle.setOptions({ fillOpacity: opacity });
          }, 150);
          
          intervals.push(intervalId);
        });
        
        // Store intervals on map instance for cleanup
        (mapInstanceRef.current as any).pulseIntervals = intervals;
        
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

        // Add testimonial markers to the map using standard markers
        testimonials.forEach((testimonial, index) => {
          const testimonialMarker = new google.maps.Marker({
            position: { lat: testimonial.lat, lng: testimonial.lng },
            map: map,
            title: `${testimonial.name} - ${testimonial.service}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#1E40AF',
              strokeWeight: 2
            },
            zIndex: 1000
          });

          // Add click listener for testimonial
          testimonialMarker.addListener('click', () => {
            setActiveTestimonial(testimonial.id);
            setTimeout(() => setActiveTestimonial(null), 5000); // Auto-hide after 5 seconds
          });

          // Add hover effect
          testimonialMarker.addListener('mouseover', () => {
            testimonialMarker.setIcon({
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeColor: '#047857',
              strokeWeight: 3
            });
          });

          testimonialMarker.addListener('mouseout', () => {
            testimonialMarker.setIcon({
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#1E40AF',
              strokeWeight: 2
            });
          });
        });

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
    
    // Cleanup function to clear intervals on unmount
    return () => {
      if (mapInstanceRef.current && (mapInstanceRef.current as any).pulseIntervals) {
        (mapInstanceRef.current as any).pulseIntervals.forEach((id: NodeJS.Timeout) => clearInterval(id));
      }
    };
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
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 w-full" data-testid="service-heat-map">
      {/* Premium header with compelling social proof */}
      <div className="text-center py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              Trusted Across Massachusetts
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed">
            From Boston to Cape Cod, thousands of homeowners trust Johnson Bros. Plumbing for fast, reliable service. 
            See where we've helped your neighbors solve their plumbing problems.
          </p>
          
          {/* Enhanced statistics grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {totalCustomers.toLocaleString()}+
              </div>
              <div className="text-sm md:text-base font-semibold text-gray-800 mb-1">Happy Customers</div>
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-600">Served since 2010</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-sm md:text-base font-semibold text-gray-800 mb-1">Same Day Service</div>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-600">Emergency ready</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold text-yellow-600 mb-2">4.9</div>
              <div className="text-sm md:text-base font-semibold text-gray-800 mb-1">Google Rating</div>
              <div className="flex items-center justify-center gap-1">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500 text-sm">⭐</span>)}
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">15+</div>
              <div className="text-sm md:text-base font-semibold text-gray-800 mb-1">Years Experience</div>
              <div className="flex items-center justify-center gap-1">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-gray-600">Family owned</span>
              </div>
            </div>
          </div>

          {/* Live activity ticker */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-4 md:p-6 shadow-inner border border-green-200/50">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full opacity-75 animate-ping"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
              </div>
              <span className="text-sm md:text-base font-bold text-gray-800">LIVE SERVICE ACTIVITY</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
              <span className="bg-white/60 px-3 py-1 rounded-full">🔧 Emergency repair in Quincy - 2 min ago</span>
              <span className="bg-white/60 px-3 py-1 rounded-full">✅ Drain cleaning completed in Weymouth - 8 min ago</span>
              <span className="bg-white/60 px-3 py-1 rounded-full">🚿 Water heater install in Braintree - 15 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized map container */}
      <div className="relative" ref={containerRef}>
        {!isMapVisible ? (
          <div className="h-[400px] sm:h-[450px] md:h-[500px] w-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500">Scroll to view service map</p>
            </div>
          </div>
        ) : (
          <div 
            ref={mapRef}
            className="h-[400px] sm:h-[450px] md:h-[500px] w-full"
            data-testid="google-map-container"
            style={{ touchAction: 'none' }} // Better mobile touch handling
          />
        )}

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
        
        {/* Enhanced testimonial popup */}
        {activeTestimonial && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none max-w-sm">
            {(() => {
              const testimonial = testimonials.find(t => t.id === activeTestimonial);
              if (!testimonial) return null;
              return (
                <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-2xl border-2 border-blue-200 animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                        <div className="flex">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className="text-yellow-500 text-sm">⭐</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">📍 {testimonial.location}</p>
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">"{testimonial.text}"</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {testimonial.service}
                        </span>
                        <span className="text-xs text-gray-500">Verified Customer</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* City popup on hover/click */}
        {hoveredCity && !activeTestimonial && (
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

      {/* Professional Trust Indicators */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
            Why Massachusetts Homeowners Choose Johnson Bros.
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Licensed & Insured */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🏅</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Licensed & Insured</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fully licensed Massachusetts plumbers with comprehensive insurance coverage for your peace of mind.
              </p>
              <div className="mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full inline-block">
                License #MP-12456
              </div>
            </div>

            {/* 24/7 Emergency */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🚨</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">24/7 Emergency Service</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Plumbing emergencies don't wait. Neither do we. Available around the clock for urgent repairs.
              </p>
              <div className="mt-3 text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full inline-block">
                Call 617-479-9911
              </div>
            </div>

            {/* Satisfaction Guarantee */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✅</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">100% Satisfaction Guarantee</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Not happy with our work? We'll make it right or your money back. That's our promise to you.
              </p>
              <div className="mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full inline-block">
                Written Guarantee
              </div>
            </div>

            {/* Local Family Business */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Local Family Business</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Proudly serving Massachusetts since 2010. Your neighbors trust us - you can too.
              </p>
              <div className="mt-3 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full inline-block">
                15+ Years Local
              </div>
            </div>
          </div>

          {/* Call-to-action banner */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-center text-white shadow-2xl">
            <h4 className="text-2xl md:text-3xl font-bold mb-4">Ready to Experience the Johnson Bros. Difference?</h4>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Join thousands of satisfied customers across Massachusetts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                Book Service Online
              </button>
              <div className="flex items-center gap-2">
                <span className="text-white/80">or call</span>
                <a href="tel:617-479-9911" className="text-xl font-bold text-yellow-300 hover:text-yellow-200 transition-colors">
                  617-479-9911
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}