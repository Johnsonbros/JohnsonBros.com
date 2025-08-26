import { useQuery } from "@tanstack/react-query";
import { Clock, Shield, DollarSign, Calendar, Phone, AlertCircle, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface HeroSectionProps {
  onBookService: () => void;
}

interface CapacityData {
  overall: {
    score: number;
    state: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY';
  };
  tech: {
    nate: { score: number; open_windows: string[] };
    nick: { score: number; open_windows: string[] };
    jahz: { score: number; open_windows: string[] };
  };
  ui_copy: {
    headline: string;
    subhead: string;
    cta: string;
    badge?: string;
    urgent: boolean;
  };
  expires_at: string;
  express_eligible?: boolean;
  express_windows?: string[];
}

export default function ExpressBooking({ onBookService }: HeroSectionProps) {
  const [userZip, setUserZip] = useState<string | null>(null);
  
  // Fetch capacity data
  const { data: capacity, isLoading } = useQuery<CapacityData>({
    queryKey: ['/api/capacity/today', userZip],
    queryFn: async () => {
      const url = userZip ? `/api/capacity/today?zip=${userZip}` : '/api/capacity/today';
      const response = await apiRequest("GET", url);
      return response.json();
    },
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
  });

  // Check if user's location makes them eligible for express booking
  useEffect(() => {
    // Try to get ZIP from browser geolocation or stored preference
    const storedZip = localStorage.getItem('user_zip');
    if (storedZip) {
      setUserZip(storedZip);
    }
  }, []);

  const handleExpressBooking = () => {
    // Store express booking intent
    if (capacity?.overall.state === 'SAME_DAY_FEE_WAIVED' || capacity?.overall.state === 'LIMITED_SAME_DAY') {
      sessionStorage.setItem('booking_type', 'express');
      sessionStorage.setItem('booking_promo', capacity.overall.state === 'SAME_DAY_FEE_WAIVED' ? 'FEEWAIVED_SAMEDAY' : '');
      sessionStorage.setItem('booking_utm_source', 'site');
      sessionStorage.setItem('booking_utm_campaign', 'express_booking');
      
      // Store available express windows
      if (capacity.express_windows) {
        sessionStorage.setItem('express_windows', JSON.stringify(capacity.express_windows));
      }
    } else {
      sessionStorage.setItem('booking_type', 'standard');
      sessionStorage.removeItem('booking_promo');
      sessionStorage.removeItem('express_windows');
    }
    onBookService();
  };

  // Determine if express booking is available
  const hasExpressSlots = capacity?.overall.state !== 'NEXT_DAY';
  const isExpressEligible = capacity?.express_eligible !== false; // Default to true if not specified
  const showExpressBooking = hasExpressSlots && isExpressEligible;
  const showFeeWaived = capacity?.overall.state === 'SAME_DAY_FEE_WAIVED';
  const isUrgent = capacity?.ui_copy?.urgent || showFeeWaived;

  // Count available express windows
  const expressWindowCount = capacity?.express_windows?.length || 0;

  return (
    <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-12 sm:py-16 lg:py-20 bg-pipes-blue relative overflow-hidden" style={{ backgroundBlendMode: 'overlay' }}>
      {/* Animated background for express availability */}
      {showExpressBooking && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Express Badge */}
            {capacity?.ui_copy?.badge && (
              <div className="mb-4">
                <Badge 
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-bold
                    ${isUrgent 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                      : showExpressBooking
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                        : 'bg-orange-500 text-white'}
                  `}
                  data-testid="express-badge"
                >
                  {showExpressBooking && <Zap className="mr-2 h-4 w-4 animate-bounce" />}
                  {capacity.ui_copy.badge}
                </Badge>
              </div>
            )}

            {/* Dynamic Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              {capacity ? (
                <>
                  {capacity.ui_copy.headline}
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">
                    Abington & Quincy, MA
                  </span>
                </>
              ) : (
                <>
                  Schedule Your Service
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">
                    Abington & Quincy, MA
                  </span>
                </>
              )}
            </h2>

            {/* Dynamic Subhead */}
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-blue-100">
              {capacity?.ui_copy?.subhead || "Fast, reliable, and professional plumbing solutions. Licensed, insured, and available 24/7 for emergencies."}
            </p>

            {/* Express Availability Indicator */}
            {showExpressBooking && expressWindowCount > 0 && capacity && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-green-400 animate-pulse mr-2" />
                    <span className="font-semibold text-green-100">
                      {expressWindowCount} Express Slot{expressWindowCount > 1 ? 's' : ''} Available Today
                    </span>
                  </div>
                  {showFeeWaived && (
                    <Badge className="bg-green-500 text-white">
                      $99 Fee Waived
                    </Badge>
                  )}
                </div>
                {capacity.express_windows && capacity.express_windows.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {capacity.express_windows.slice(0, 3).map((window, idx) => (
                      <span key={idx} className="text-sm bg-white/10 px-2 py-1 rounded">
                        {window}
                      </span>
                    ))}
                    {capacity.express_windows.length > 3 && (
                      <span className="text-sm text-blue-200">
                        +{capacity.express_windows.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <Clock className={`h-5 w-5 flex-shrink-0 ${showExpressBooking ? 'text-green-400 animate-pulse' : 'text-johnson-orange'}`} />
                <span className="font-medium text-sm sm:text-base">
                  {showExpressBooking ? 'Express Same-Day' : 'Same Day Service'}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <Shield className="h-5 w-5 text-johnson-orange flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <DollarSign className="h-5 w-5 text-johnson-orange flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Upfront Pricing</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <Button 
                onClick={handleExpressBooking}
                className={`
                  px-6 py-4 sm:px-8 rounded-lg font-bold text-lg 
                  transition-all duration-300 transform hover:scale-105 shadow-xl 
                  w-full sm:w-auto touch-target relative overflow-hidden
                  ${showExpressBooking 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                    : 'bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange'}
                `}
                data-testid="express-booking-button"
                disabled={isLoading}
              >
                {showExpressBooking && (
                  <span className="absolute inset-0 bg-white opacity-20 animate-shimmer" />
                )}
                <span className="relative flex items-center">
                  {showExpressBooking ? (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      {isLoading ? 'Checking...' : capacity?.ui_copy?.cta || 'Book Express Service'}
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-5 w-5" />
                      {isLoading ? 'Checking...' : capacity?.ui_copy?.cta || 'Book Service'}
                    </>
                  )}
                </span>
              </Button>
              <a 
                href="tel:6174799911" 
                className="bg-white text-johnson-blue px-6 py-4 sm:px-8 rounded-lg font-bold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg text-center inline-flex items-center justify-center w-full sm:w-auto touch-target border-2 border-johnson-blue hover:border-johnson-teal"
                data-testid="hero-call-button"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call (617) 479-9911
              </a>
            </div>

            {/* Location eligibility notice */}
            {!isExpressEligible && hasExpressSlots && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-100">
                      Express booking is available for customers in our immediate service area.
                    </p>
                    <Button
                      variant="link"
                      className="text-yellow-300 hover:text-yellow-100 p-0 h-auto text-sm"
                      onClick={() => {
                        const zip = prompt("Enter your ZIP code to check express eligibility:");
                        if (zip) {
                          localStorage.setItem('user_zip', zip);
                          setUserZip(zip);
                        }
                      }}
                    >
                      Check your ZIP code
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative mt-8 lg:mt-0">
            {/* Professional plumber working on modern bathroom fixtures */}
            <img 
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Professional plumber installing modern fixtures" 
              className="rounded-xl shadow-2xl w-full"
            />
            
            {/* Floating Service Badge - Dynamic based on express availability */}
            <div className={`absolute -bottom-3 -left-3 sm:-bottom-6 sm:-left-6 bg-white p-3 sm:p-6 rounded-xl shadow-lg ${showExpressBooking ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}>
              <div className="text-center">
                {showExpressBooking ? (
                  <>
                    <Zap className="h-8 w-8 text-green-500 mx-auto mb-2 animate-bounce" />
                    <div className="text-xl sm:text-2xl font-bold text-green-600">EXPRESS</div>
                    <div className="text-xs sm:text-sm text-gray-600">Same-Day Service</div>
                    {showFeeWaived && (
                      <div className="text-xs text-green-600 font-medium mt-1">Fee Waived!</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-johnson-blue" data-testid="service-fee">
                      $99
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Service Fee</div>
                    <div className="text-xs text-green-600 font-medium">Applied to repair</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}