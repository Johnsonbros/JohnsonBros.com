/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Phone, ChevronRight, Navigation, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ServiceLocation {
  name: string;
  lat: number;
  lng: number;
  description: string;
  services: string[];
  responseTime: string;
  hasPage: boolean;
}

const serviceLocations: ServiceLocation[] = [
  {
    name: "Quincy",
    lat: 42.2529,
    lng: -71.0023,
    description: "Our headquarters - fastest response times",
    services: ["Emergency Plumbing", "Drain Cleaning", "Water Heaters", "Gas Lines"],
    responseTime: "15-30 min",
    hasPage: true
  },
  {
    name: "Abington",
    lat: 42.1049,
    lng: -70.9453,
    description: "Secondary office location - full service coverage",
    services: ["Emergency Plumbing", "Drain Cleaning", "Water Heaters"],
    responseTime: "15-30 min",
    hasPage: false
  },
  {
    name: "Braintree",
    lat: 42.2043,
    lng: -71.0017,
    description: "Priority service area with dedicated coverage",
    services: ["Drain Cleaning", "Water Heaters", "Pipe Repair", "Sewer Lines"],
    responseTime: "20-40 min",
    hasPage: true
  },
  {
    name: "Weymouth",
    lat: 42.2209,
    lng: -70.9400,
    description: "Full-service plumbing for all of Weymouth",
    services: ["Emergency Plumbing", "Drain Cleaning", "General Plumbing"],
    responseTime: "25-45 min",
    hasPage: true
  },
  {
    name: "Plymouth",
    lat: 41.9584,
    lng: -70.6673,
    description: "Historic Plymouth - reliable plumbing solutions",
    services: ["Drain Cleaning", "Water Heaters", "Pipe Repair"],
    responseTime: "35-55 min",
    hasPage: true
  },
  {
    name: "Marshfield",
    lat: 42.0915,
    lng: -70.7056,
    description: "Coastal specialists for Marshfield residents",
    services: ["Emergency Plumbing", "Drain Cleaning", "Sewer Lines"],
    responseTime: "30-50 min",
    hasPage: true
  },
  {
    name: "Hingham",
    lat: 42.2418,
    lng: -70.8898,
    description: "Premium plumbing services for Hingham homes",
    services: ["Water Heaters", "Pipe Repair", "New Construction"],
    responseTime: "20-40 min",
    hasPage: true
  },
  {
    name: "Milton",
    lat: 42.2493,
    lng: -71.0662,
    description: "Expert service for Milton's beautiful neighborhoods",
    services: ["Emergency Plumbing", "Drain Cleaning", "Pipe Repair"],
    responseTime: "20-35 min",
    hasPage: false
  },
  {
    name: "Hull",
    lat: 42.3020,
    lng: -70.8578,
    description: "Coastal plumbing specialists for Hull",
    services: ["Emergency Plumbing", "Drain Cleaning", "Water Heaters"],
    responseTime: "30-50 min",
    hasPage: false
  },
  {
    name: "Scituate",
    lat: 42.1995,
    lng: -70.7264,
    description: "Reliable coastal plumbing services",
    services: ["Drain Cleaning", "Pipe Repair", "General Plumbing"],
    responseTime: "35-55 min",
    hasPage: false
  },
  {
    name: "Cohasset",
    lat: 42.2418,
    lng: -70.8176,
    description: "Premium residential plumbing solutions",
    services: ["Water Heaters", "New Construction", "Pipe Repair"],
    responseTime: "25-45 min",
    hasPage: false
  },
  {
    name: "Rockland",
    lat: 42.1298,
    lng: -70.9076,
    description: "Trusted local plumbers serving Rockland",
    services: ["Emergency Plumbing", "Drain Cleaning", "General Plumbing"],
    responseTime: "25-45 min",
    hasPage: false
  },
  {
    name: "Hanover",
    lat: 42.1134,
    lng: -70.8112,
    description: "Expert drain cleaning and repairs",
    services: ["Drain Cleaning", "Pipe Repair", "Water Heaters"],
    responseTime: "30-50 min",
    hasPage: false
  },
  {
    name: "Duxbury",
    lat: 42.0417,
    lng: -70.6723,
    description: "Quality plumbing for Duxbury homes",
    services: ["Drain Cleaning", "Water Heaters", "Pipe Repair"],
    responseTime: "35-55 min",
    hasPage: false
  }
];

interface InteractiveCoverageMapProps {
  onBookService?: () => void;
  compact?: boolean;
}

export function InteractiveCoverageMap({ onBookService, compact = false }: InteractiveCoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userInServiceArea, setUserInServiceArea] = useState<boolean | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const { toast } = useToast();

  const handleLocationClick = useCallback((location: ServiceLocation) => {
    setSelectedLocation(location);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapInstanceRef.current.setZoom(12);
    }
  }, []);

  const checkUserLocation = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          const inArea = userLat > 41.5 && userLat < 42.5 && userLng > -71.5 && userLng < -70.3;
          setUserInServiceArea(inArea);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo({ lat: userLat, lng: userLng });
            mapInstanceRef.current.setZoom(12);
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          toast({
            title: "Location unavailable",
            description: "Could not get your location. Please check browser settings.",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      const loader = new Loader({
        apiKey: apiKey || "",
        version: "weekly",
        libraries: ["marker", "geometry"]
      });

      try {
        const google = await loader.load();
        await google.maps.importLibrary("marker");
        
        const map = new google.maps.Map(mapRef.current!, {
          zoom: compact ? 8 : 9,
          center: { lat: 42.1, lng: -70.85 },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: "JOHNSON_BROS_MAP",
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: !compact,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] }
          ]
        });

        mapInstanceRef.current = map;

        const serviceAreaPath = [
          { lat: 42.36, lng: -71.06 },
          { lat: 42.37, lng: -71.00 },
          { lat: 42.33, lng: -70.90 },
          { lat: 42.28, lng: -70.85 },
          { lat: 42.23, lng: -70.78 },
          { lat: 42.18, lng: -70.70 },
          { lat: 42.12, lng: -70.62 },
          { lat: 42.00, lng: -70.52 },
          { lat: 41.88, lng: -70.50 },
          { lat: 41.76, lng: -70.54 },
          { lat: 41.72, lng: -70.62 },
          { lat: 41.78, lng: -70.82 },
          { lat: 41.88, lng: -70.91 },
          { lat: 41.93, lng: -71.04 },
          { lat: 42.03, lng: -71.23 },
          { lat: 42.15, lng: -71.26 },
          { lat: 42.27, lng: -71.26 },
          { lat: 42.38, lng: -71.24 },
          { lat: 42.37, lng: -71.10 },
        ];

        new google.maps.Polygon({
          paths: serviceAreaPath,
          strokeColor: "#0b2a6f",
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: "#3B82F6",
          fillOpacity: 0.1,
          map: map,
        });

        serviceLocations.forEach((location) => {
          const isHQ = location.name === "Quincy" || location.name === "Abington";
          
          const markerContent = document.createElement("div");
          markerContent.innerHTML = `
            <div class="marker-container" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transform: translate(-50%, -100%);
            ">
              <div class="marker-pin" style="
                width: ${isHQ ? "48px" : "36px"};
                height: ${isHQ ? "48px" : "36px"};
                background: ${isHQ ? "linear-gradient(135deg, #0b2a6f 0%, #1e40af 100%)" : "#3B82F6"};
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.2s ease;
              ">
                <svg style="transform: rotate(45deg);" width="${isHQ ? "24" : "18"}" height="${isHQ ? "24" : "18"}" viewBox="0 0 24 24" fill="white">
                  ${isHQ ? 
                    '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' :
                    '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>'
                  }
                </svg>
              </div>
              <div style="
                background: white;
                padding: 4px 8px;
                border-radius: 4px;
                margin-top: 4px;
                font-size: 11px;
                font-weight: 600;
                color: #0b2a6f;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                white-space: nowrap;
              ">
                ${location.name}
                ${isHQ ? '<span style="font-size: 9px; color: #10B981; margin-left: 4px;">HQ</span>' : ''}
              </div>
            </div>
          `;

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            content: markerContent,
            title: location.name
          });

          markerContent.addEventListener("click", () => {
            handleLocationClick(location);
          });

          markerContent.addEventListener("mouseenter", () => {
            const pin = markerContent.querySelector(".marker-pin") as HTMLElement;
            if (pin) {
              pin.style.transform = "rotate(-45deg) scale(1.15)";
            }
          });

          markerContent.addEventListener("mouseleave", () => {
            const pin = markerContent.querySelector(".marker-pin") as HTMLElement;
            if (pin) {
              pin.style.transform = "rotate(-45deg) scale(1)";
            }
          });

          markersRef.current.push(marker);
        });

        setIsMapLoaded(true);
      } catch (error) {
        console.error("Error loading map:", error);
        setMapError(true);
        setIsMapLoaded(true);
      }
    };

    initMap();

    return () => {
      markersRef.current = [];
    };
  }, [handleLocationClick, compact, toast]);

  return (
    <div className="w-full" data-testid="interactive-coverage-map">
      <div className={`grid ${compact ? "" : "lg:grid-cols-3"} gap-6`}>
        <div className={`${compact ? "" : "lg:col-span-2"} relative`}>
          <div 
            ref={mapRef} 
            className={`w-full ${compact ? "h-[350px]" : "h-[500px]"} rounded-2xl shadow-lg border border-gray-200 overflow-hidden`}
            data-testid="coverage-map-canvas"
          />
          
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-johnson-blue/30 border-t-johnson-blue rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading service map...</p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Map temporarily unavailable</h3>
                <p className="text-gray-600 mb-4 max-w-sm">
                  We service all of the South Shore MA including Quincy, Braintree, Weymouth, Plymouth, and surrounding areas.
                </p>
                <Button asChild className="bg-johnson-blue">
                  <a href="tel:6174799911">
                    <Phone className="h-4 w-4 mr-2" />
                    Call (617) 479-9911
                  </a>
                </Button>
              </div>
            </div>
          )}

          {!mapError && <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Button
              size="sm"
              onClick={checkUserLocation}
              disabled={isLocating}
              className="bg-white text-johnson-blue border border-gray-200 hover:bg-gray-50 shadow-lg"
              data-testid="check-location-btn"
            >
              <Navigation className={`h-4 w-4 mr-2 ${isLocating ? "animate-spin" : ""}`} />
              {isLocating ? "Locating..." : "Check My Area"}
            </Button>
          </div>

          {userInServiceArea !== null && (
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
              userInServiceArea ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
            }`}>
              {userInServiceArea ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  We service your area!
                </span>
              ) : (
                <span>Call us to confirm coverage</span>
              )}
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-gradient-to-r from-johnson-blue to-blue-600 rounded-full border-2 border-white shadow" />
                <span>HQ Office</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow" />
                <span>Service Area</span>
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="space-y-4">
            {selectedLocation ? (
              <Card className="border-2 border-johnson-blue shadow-xl animate-fade-in" data-testid="location-detail-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedLocation.name}, MA</h3>
                      <p className="text-gray-600">{selectedLocation.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {selectedLocation.responseTime}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Services Available:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.services.map((service) => (
                        <Badge key={service} variant="secondary" className="bg-blue-50 text-blue-700">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {onBookService && (
                      <Button 
                        onClick={onBookService}
                        className="w-full bg-johnson-blue hover:bg-johnson-blue/90"
                        data-testid="book-service-btn"
                      >
                        Book Service in {selectedLocation.name}
                      </Button>
                    )}
                    {selectedLocation.hasPage && (
                      <Link href={`/service-areas/${selectedLocation.name.toLowerCase()}`}>
                        <Button variant="outline" className="w-full border-johnson-blue text-johnson-blue">
                          View {selectedLocation.name} Page
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" asChild className="w-full">
                      <a href="tel:6174799911">
                        <Phone className="h-4 w-4 mr-2" />
                        Call (617) 479-9911
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200" data-testid="location-prompt-card">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-johnson-blue mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Location
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Click on any marker on the map to see detailed service information for that area.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                  All Service Areas
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                  {serviceLocations.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleLocationClick(loc)}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLocation?.name === loc.name
                          ? "bg-johnson-blue text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      data-testid={`location-btn-${loc.name.toLowerCase()}`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
