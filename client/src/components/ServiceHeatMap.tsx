import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity } from "lucide-react";
import { useState } from "react";

interface HeatMapData {
  city: string;
  count: number;
  lat: number;
  lng: number;
  intensity: number;
}

export function ServiceHeatMap() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  const { data: heatMapData = [], isLoading } = useQuery<HeatMapData[]>({
    queryKey: ["/api/social-proof/service-heat-map"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl" data-testid="heat-map-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Massachusetts Service Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <p className="text-gray-500">Loading service area map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...heatMapData.map(d => d.count));

  const getIntensityColor = (intensity: number) => {
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-500';
    if (intensity > 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getIntensitySize = (intensity: number) => {
    const baseSize = 8;
    const maxSize = 32;
    return baseSize + (intensity * (maxSize - baseSize));
  };

  // Massachusetts boundary approximate
  const maBounds = {
    north: 42.9,
    south: 41.2,
    west: -73.5,
    east: -69.9
  };

  // Convert lat/lng to SVG coordinates
  const latToY = (lat: number) => {
    const latRange = maBounds.north - maBounds.south;
    const normalized = (maBounds.north - lat) / latRange;
    return normalized * 400; // SVG height
  };

  const lngToX = (lng: number) => {
    const lngRange = maBounds.east - maBounds.west;
    const normalized = (lng - maBounds.west) / lngRange;
    return normalized * 600; // SVG width
  };

  return (
    <Card className="w-full max-w-4xl shadow-lg" data-testid="service-heat-map">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-blue-500" />
          Massachusetts Service Coverage
          <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700" data-testid="coverage-badge">
            {heatMapData.length} cities served
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* SVG Heat Map */}
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4">
            <svg 
              viewBox="0 0 600 400" 
              className="w-full h-96 border border-gray-200 rounded-lg bg-white"
              data-testid="heat-map-svg"
            >
              {/* Massachusetts outline (simplified) */}
              <path
                d="M50,200 L150,180 L250,170 L350,160 L450,150 L550,160 L550,250 L450,280 L350,290 L250,300 L150,310 L50,300 Z"
                fill="rgba(59, 130, 246, 0.1)"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="2"
              />
              
              {/* Service points */}
              {heatMapData.map((point, index) => {
                const x = lngToX(point.lng);
                const y = latToY(point.lat);
                const size = getIntensitySize(point.intensity);
                
                return (
                  <g key={point.city}>
                    {/* Glow effect */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size * 1.5}
                      fill={`url(#glow-${index})`}
                      opacity="0.3"
                      className="animate-pulse"
                    />
                    {/* Main point */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size / 2}
                      className={`${getIntensityColor(point.intensity)} cursor-pointer transition-all duration-200 hover:scale-110`}
                      opacity="0.8"
                      onClick={() => setSelectedCity(selectedCity === point.city ? null : point.city)}
                      data-testid={`heat-point-${point.city}`}
                    />
                    
                    {/* City label for major cities */}
                    {point.count > 5 && (
                      <text
                        x={x}
                        y={y - size / 2 - 5}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700"
                        data-testid={`city-label-${point.city}`}
                      >
                        {point.city}
                      </text>
                    )}
                    
                    {/* Gradient definitions */}
                    <defs>
                      <radialGradient id={`glow-${index}`}>
                        <stop offset="0%" stopColor={getIntensityColor(point.intensity).replace('bg-', '')} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={getIntensityColor(point.intensity).replace('bg-', '')} stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </g>
                );
              })}
            </svg>
            
            {/* Selected city info */}
            {selectedCity && (
              <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border animate-fade-in-up" data-testid="selected-city-info">
                <h4 className="font-medium text-gray-900">{selectedCity}</h4>
                <p className="text-sm text-gray-600">
                  {heatMapData.find(d => d.city === selectedCity)?.count} services completed
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Service Density:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Low</span>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Medium</span>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-600">High</span>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Very High</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="h-4 w-4" />
              Click dots for details
            </div>
          </div>

          {/* Top served cities */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {heatMapData.slice(0, 8).map((city) => (
              <div
                key={city.city}
                className="bg-white border rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedCity(selectedCity === city.city ? null : city.city)}
                data-testid={`city-card-${city.city}`}
              >
                <div className="font-medium text-sm text-gray-900">{city.city}</div>
                <div className="text-xs text-gray-600">{city.count} services</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}