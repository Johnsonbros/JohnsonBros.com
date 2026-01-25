import { useQuery } from "@tanstack/react-query";
import { MapPin, Activity, Users, TrendingUp, Navigation, Phone, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { getGoogleMapsLoader } from "@/lib/googleMapsLoader";

/// <reference types="@types/google.maps" />

interface HeatMapSnapshot {
  imageUrl: string;
  dataPointCount: number;
  generatedAt: string;
  metadata?: {
    generatedAt?: string;
    dataPoints?: number;
  } | null;
}

interface ServiceHeatMapProps {
  onBookService?: () => void;
}

export function ServiceHeatMap({ onBookService }: ServiceHeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const snapshotOverlayRef = useRef<google.maps.GroundOverlay | null>(null);
  const googleMapsRef = useRef<typeof google | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: heatMapSnapshot, isLoading } = useQuery<HeatMapSnapshot | null>({
    queryKey: ['/api/v1/heatmap/snapshot'],
    queryFn: async () => {
      const response = await fetch('/api/v1/heatmap/snapshot', { credentials: 'include' });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      return response.json();
    },
  });

  // Calculate total customers from snapshot metadata
  useEffect(() => {
    if (heatMapSnapshot?.dataPointCount) {
      setTotalCustomers(heatMapSnapshot.dataPointCount);
    }
  }, [heatMapSnapshot]);

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
    if (!mapRef.current || !isMapVisible) return;

    const initializeMap = async () => {
      const loader = getGoogleMapsLoader();

      if (!loader) {
        console.warn("Google Maps API key is not configured. Map features will be limited.");
        // You could optionally show a message to the user or use a fallback
        return;
      }

      try {
        const google = await loader.load();
        googleMapsRef.current = google;
        
        // Mobile-optimized map settings
        const isMobile = window.innerWidth <= 768;
        const map = new google.maps.Map(mapRef.current!, {
          zoom: isMobile ? 8 : 9, // Wider view on mobile
          center: { lat: 42.05, lng: -70.85 }, // Centered on service area
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

        // Create polygon following route: Boston to Cape Cod Canal along coast, then I-495 north through Middleboro, Taunton, Raynham, Norton, Foxboro to Waltham
        const serviceAreaBoundary = new google.maps.Polygon({
          paths: [
            { lat: 42.36, lng: -71.06 },  // Boston (starting point)
            { lat: 42.37, lng: -71.00 },  // Boston Harbor
            { lat: 42.36, lng: -70.95 },  // Winthrop/coastal curve
            { lat: 42.33, lng: -70.90 },  // Hull
            { lat: 42.28, lng: -70.85 },  // Weymouth/Hingham Bay
            { lat: 42.23, lng: -70.78 },  // Hingham
            { lat: 42.18, lng: -70.70 },  // Cohasset
            { lat: 42.12, lng: -70.62 },  // Scituate
            { lat: 42.06, lng: -70.56 },  // Scituate Harbor
            { lat: 42.00, lng: -70.52 },  // Marshfield coast
            { lat: 41.94, lng: -70.50 },  // Marshfield south
            { lat: 41.88, lng: -70.50 },  // Duxbury coast
            { lat: 41.82, lng: -70.52 },  // Duxbury Bay
            { lat: 41.76, lng: -70.54 },  // Plymouth coast
            { lat: 41.73, lng: -70.56 },  // Plymouth Bay
            { lat: 41.72, lng: -70.62 },  // Plymouth/Cape Cod Canal (east)
            { lat: 41.73, lng: -70.68 },  // Cape Cod Canal area
            { lat: 41.75, lng: -70.74 },  // Cape Cod Canal
            { lat: 41.78, lng: -70.82 },  // I-495 south - Wareham
            { lat: 41.83, lng: -70.88 },  // I-495 - Middleboro approach
            { lat: 41.88, lng: -70.91 },  // I-495 - Middleboro
            { lat: 41.90, lng: -71.09 },  // I-495 - Taunton
            { lat: 41.93, lng: -71.04 },  // I-495 - Raynham
            { lat: 41.97, lng: -71.19 },  // I-495 - Norton
            { lat: 42.03, lng: -71.23 },  // I-495 - Mansfield area
            { lat: 42.07, lng: -71.25 },  // I-495 - Foxboro
            { lat: 42.13, lng: -71.26 },  // I-495 - Walpole approach
            { lat: 42.15, lng: -71.26 },  // I-495 - Walpole
            { lat: 42.21, lng: -71.26 },  // I-495 - Norwood
            { lat: 42.27, lng: -71.26 },  // I-495 - Westwood
            { lat: 42.32, lng: -71.25 },  // I-495 - Needham/Wellesley
            { lat: 42.38, lng: -71.24 },  // I-495 - Waltham (northwest point)
            { lat: 42.38, lng: -71.18 },  // Newton area
            { lat: 42.38, lng: -71.15 },  // Newton/Watertown area
            { lat: 42.37, lng: -71.10 },  // Cambridge/Somerville
          ],
          strokeColor: '#2563EB',
          strokeOpacity: 0.9,
          strokeWeight: 4,
          fillColor: '#3B82F6',
          fillOpacity: 0.12,
          map: map,
          clickable: false,
        });

        // Add animated border effect
        let borderOpacity = 0.9;
        let increasing = false;
        const borderInterval = setInterval(() => {
          if (!serviceAreaBoundary) {
            clearInterval(borderInterval);
            return;
          }
          if (increasing) {
            borderOpacity += 0.02;
            if (borderOpacity >= 1) increasing = false;
          } else {
            borderOpacity -= 0.02;
            if (borderOpacity <= 0.7) increasing = true;
          }
          serviceAreaBoundary.setOptions({ strokeOpacity: borderOpacity });
        }, 100);

        // Store interval for cleanup
        if (!mapInstanceRef.current.pulseIntervals) {
          mapInstanceRef.current.pulseIntervals = [];
        }
        mapInstanceRef.current.pulseIntervals.push(borderInterval);

        // Define custom overlay class for HTML markers (used by both service areas and offices)
        const CustomMarker = class extends google.maps.OverlayView {
          position: any;
          div: HTMLElement | null = null;

          constructor(position: any, content: HTMLElement) {
            super();
            this.position = position;
            this.div = content;
          }

          onAdd() {
            const panes = (this as any).getPanes();
            if (panes && this.div) {
              panes.overlayMouseTarget.appendChild(this.div);
            }
          }

          draw() {
            if (!this.div) return;
            const projection = (this as any).getProjection();
            const position = projection.fromLatLngToDivPixel(this.position);
            if (position) {
              this.div.style.left = position.x + 'px';
              this.div.style.top = position.y + 'px';
              this.div.style.position = 'absolute';
            }
          }

          onRemove() {
            if (this.div && this.div.parentNode) {
              this.div.parentNode.removeChild(this.div);
            }
          }
        };

        // Add Google Business Profile markers for office locations
        const officeLocations = [
          {
            name: "Quincy Office",
            address: "75 East Elm Ave, Quincy, MA 02170",
            lat: 42.2529,
            lng: -71.0023,
            googleUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
            rating: 4.8,
            reviews: 281
          },
          {
            name: "Abington Office",
            address: "55 Brighton St, Abington, MA 02351",
            lat: 42.1049,
            lng: -70.9453,
            googleUrl: "https://maps.app.goo.gl/4J1fqFee3JWa9ofX8",
            rating: 5.0,
            reviews: 21
          }
        ];

        officeLocations.forEach((office) => {
          // Create custom office marker
          const officeMarkerDiv = document.createElement('div');
          officeMarkerDiv.className = 'office-marker';
          officeMarkerDiv.innerHTML = `
            <a href="${office.googleUrl}" target="_blank" rel="noopener noreferrer" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              text-decoration: none;
              transform: translate(-50%, -100%);
              cursor: pointer;
            ">
              <div style="
                background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
                border: 3px solid white;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                position: relative;
              ">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div style="
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background: white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#4285f4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              </div>
              <div style="
                background: white;
                padding: 6px 12px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                white-space: nowrap;
                font-weight: 600;
                font-size: 13px;
                color: #1f2937;
              ">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>⭐ ${office.rating}</span>
                  <span style="color: #6b7280; font-weight: 500;">(${office.reviews})</span>
                </div>
                <div style="font-size: 11px; color: #4285f4; margin-top: 2px;">
                  View on Google
                </div>
              </div>
            </a>
          `;

          const officeOverlay = new CustomMarker(
            new google.maps.LatLng(office.lat, office.lng),
            officeMarkerDiv
          );
          (officeOverlay as any).setMap(map);

          // Add hover effect
          officeMarkerDiv.addEventListener('mouseenter', () => {
            const pinElement = officeMarkerDiv.querySelector('div[style*="linear-gradient"]') as HTMLElement;
            if (pinElement) {
              pinElement.style.transform = 'scale(1.1)';
            }
          });

          officeMarkerDiv.addEventListener('mouseleave', () => {
            const pinElement = officeMarkerDiv.querySelector('div[style*="linear-gradient"]') as HTMLElement;
            if (pinElement) {
              pinElement.style.transform = 'scale(1)';
            }
          });
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
  }, [isMapVisible]);

  useEffect(() => {
    if (!heatMapSnapshot?.imageUrl) {
      if (snapshotOverlayRef.current) {
        snapshotOverlayRef.current.setMap(null);
        snapshotOverlayRef.current = null;
      }
      return;
    }

    const google = googleMapsRef.current;
    const map = mapInstanceRef.current as google.maps.Map | null;

    if (!google || !map) return;

    const bounds = {
      north: 42.9,
      south: 41.2,
      west: -73.5,
      east: -69.9,
    };

    if (snapshotOverlayRef.current) {
      snapshotOverlayRef.current.setMap(null);
    }

    snapshotOverlayRef.current = new google.maps.GroundOverlay(
      heatMapSnapshot.imageUrl,
      bounds,
      { opacity: 0.55 }
    );
    snapshotOverlayRef.current.setMap(map);

    return () => {
      if (snapshotOverlayRef.current) {
        snapshotOverlayRef.current.setMap(null);
      }
    };
  }, [heatMapSnapshot?.imageUrl]);

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

  const fallbackServiceAreas = [
    "Quincy",
    "Braintree",
    "Weymouth",
    "Plymouth",
    "Marshfield",
    "Hingham",
    "Cohasset",
    "Duxbury"
  ];

  if (!heatMapSnapshot) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 w-full">
        <Card className="max-w-5xl mx-auto border border-blue-100/70 shadow-lg">
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-7 w-7 text-blue-600" />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Service Coverage Snapshot</h3>
                  <p className="text-sm text-gray-500">
                    Snapshot data is loading. In the meantime, here are our core service areas.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    South Shore Coverage
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Emergency and scheduled service across Greater Boston and the South Shore.
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
                    {fallbackServiceAreas.map((area) => (
                      <li key={area} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Need service today?
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Our dispatch team can confirm availability and schedule an ETA fast.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={onBookService} className="w-full sm:w-auto">
                      Book Service
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <Link href="/service-areas">View service areas</Link>
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    Prefer to call? (617) 555-1234
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="h-[400px] sm:h-[450px] md:h-[500px] w-full bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
            <div className="max-w-2xl text-center">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Service Area</h3>
              <p className="text-lg text-gray-700 mb-6">
                Proudly serving communities across Eastern Massachusetts
              </p>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Boston</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Quincy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Braintree</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Weymouth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Milton</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>& Surrounding Areas</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Scroll down to see our interactive service map</p>
              </div>
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
                <span className="text-xs font-medium text-gray-700">Snapshot</span>
              </div>
              <span className="text-xs text-gray-500">
                • Updated {heatMapSnapshot?.generatedAt
                  ? new Date(heatMapSnapshot.generatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Pending'}
              </span>
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
                  COVERAGE SNAPSHOT
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {heatMapSnapshot
                  ? `${Math.max(1, Math.floor(heatMapSnapshot.dataPointCount / 15))} Service Areas • ${heatMapSnapshot.dataPointCount.toLocaleString()} Customers`
                  : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
        
        
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
              <button 
                onClick={onBookService}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg"
                data-testid="button-book-service"
              >
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
