import { Users, Clock, TrendingUp, AlertCircle, Activity, Calendar, Eye, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface UrgencyIndicatorProps {
  type?: 'viewers' | 'slots' | 'demand' | 'combined';
  position?: 'inline' | 'floating' | 'banner';
  animated?: boolean;
  showLocation?: boolean;
}

export function UrgencyIndicator({
  type = 'combined',
  position = 'inline',
  animated = true,
  showLocation = false
}: UrgencyIndicatorProps) {
  const [viewerCount, setViewerCount] = useState(7);
  const [slotsAvailable, setSlotsAvailable] = useState(3);
  const [recentBookings, setRecentBookings] = useState(4);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Fetch capacity data
  const { data: capacityData } = useQuery({
    queryKey: ['/api/v1/capacity/today'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Simulate real-time viewer count changes
  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newCount = prev + change;
        return Math.max(3, Math.min(12, newCount)); // Keep between 3-12
      });

      // Occasionally decrease slots
      if (Math.random() < 0.1 && slotsAvailable > 1) {
        setSlotsAvailable(prev => prev - 1);
        setPulseAnimation(true);
        setTimeout(() => setPulseAnimation(false), 1000);
      }

      // Update recent bookings
      if (Math.random() < 0.2) {
        setRecentBookings(prev => Math.min(10, prev + 1));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [animated, slotsAvailable]);

  // Floating position
  if (position === 'floating') {
    return (
      <div className="fixed bottom-20 left-4 z-30 max-w-xs">
        <Card className={`p-4 bg-white shadow-xl border-2 ${pulseAnimation ? 'animate-pulse border-red-500' : 'border-gray-200'}`}>
          <div className="space-y-3">
            {/* Viewers */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Eye className="h-4 w-4 text-blue-600" />
                  {animated && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {viewerCount} viewing now
                </span>
              </div>
            </div>

            {/* Slots */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  {slotsAvailable} slots left
                </span>
              </div>
              {slotsAvailable <= 3 && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Low
                </Badge>
              )}
            </div>

            {/* Recent Activity */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600">
                {recentBookings} booked in last hour
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Banner position
  if (position === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 px-4 ${pulseAnimation ? 'animate-pulse' : ''}`}>
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {/* Live viewers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">{viewerCount} people viewing</span>
            </div>

            {/* Separator */}
            <span className="hidden sm:inline text-white/50">|</span>

            {/* Slots available */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="font-medium">
                Only {slotsAvailable} appointment{slotsAvailable !== 1 ? 's' : ''} left today
              </span>
            </div>

            {/* Separator */}
            <span className="hidden sm:inline text-white/50">|</span>

            {/* Recent bookings */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">{recentBookings} booked in last hour</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline position (default) - returns different styles based on type
  if (type === 'viewers') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg ${pulseAnimation ? 'animate-pulse' : ''}`}>
        <div className="relative">
          <Eye className="h-4 w-4 text-blue-600" />
          {animated && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-sm font-medium text-blue-900">
          {viewerCount} people viewing this page
        </span>
        {showLocation && (
          <span className="text-sm text-blue-700">
            <MapPin className="h-3 w-3 inline mr-1" />
            in Quincy area
          </span>
        )}
      </div>
    );
  }

  if (type === 'slots') {
    const urgencyLevel = slotsAvailable <= 2 ? 'high' : slotsAvailable <= 5 ? 'medium' : 'low';
    const urgencyColor = urgencyLevel === 'high' ? 'red' : urgencyLevel === 'medium' ? 'orange' : 'green';
    
    return (
      <div className={`${pulseAnimation ? 'animate-pulse' : ''}`}>
        <Card className={`p-4 border-2 ${urgencyLevel === 'high' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className={`h-5 w-5 text-${urgencyColor}-600`} />
              <span className="font-bold text-gray-900">Today's Availability</span>
            </div>
            {urgencyLevel === 'high' && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                Almost Full
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Appointments remaining:</span>
              <span className={`font-bold text-${urgencyColor}-600 text-lg`}>
                {slotsAvailable}
              </span>
            </div>
            <Progress 
              value={((10 - slotsAvailable) / 10) * 100} 
              className="h-2"
            />
            <p className="text-xs text-gray-500">
              {10 - slotsAvailable} of 10 slots booked today
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (type === 'demand') {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-red-600 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-1">High Demand Alert</h4>
            <p className="text-sm text-gray-700 mb-2">
              Service requests up 40% this week due to seasonal weather
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-600" />
                <span className="font-medium">{recentBookings} bookings</span> in last hour
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-600" />
                Avg wait: <span className="font-medium">2-3 hours</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Combined view (default)
  return (
    <Card className={`p-4 ${pulseAnimation ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-johnson-blue" />
          Live Availability Status
        </h3>
        <Badge variant="outline" className="text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
          LIVE
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Viewers */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{viewerCount}</span>
          </div>
          <p className="text-xs text-blue-700">Viewing Now</p>
        </div>

        {/* Slots */}
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="h-4 w-4 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">{slotsAvailable}</span>
          </div>
          <p className="text-xs text-orange-700">Slots Left</p>
        </div>

        {/* Recent Activity */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{recentBookings}</span>
          </div>
          <p className="text-xs text-green-700">Booked (1hr)</p>
        </div>
      </div>

      {/* Urgency message */}
      {slotsAvailable <= 3 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-medium text-red-900 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            High demand - Book now to secure your spot today
          </p>
        </div>
      )}
    </Card>
  );
}