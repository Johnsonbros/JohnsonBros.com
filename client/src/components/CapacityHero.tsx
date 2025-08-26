import { useQuery } from "@tanstack/react-query";
import { Clock, Shield, DollarSign, Calendar, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

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
}

export default function CapacityHero({ onBookService }: HeroSectionProps) {
  // Fetch capacity data
  const { data: capacity, isLoading } = useQuery<CapacityData>({
    queryKey: ['/api/capacity/today'],
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
  });

  const handleBookNow = () => {
    // If we have fee waived state, add promo params to the booking URL
    if (capacity?.overall.state === 'SAME_DAY_FEE_WAIVED') {
      // Store the promo in session storage for the booking modal to use
      sessionStorage.setItem('booking_promo', 'FEEWAIVED_SAMEDAY');
      sessionStorage.setItem('booking_utm_source', 'site');
      sessionStorage.setItem('booking_utm_campaign', 'capacity');
    } else {
      sessionStorage.removeItem('booking_promo');
      sessionStorage.removeItem('booking_utm_source');
      sessionStorage.removeItem('booking_utm_campaign');
    }
    onBookService();
  };

  // Default copy when loading or error
  const defaultCopy = {
    headline: "Expert Plumbing Services",
    subhead: "Fast, reliable, and professional plumbing solutions. Licensed, insured, and available 24/7 for emergencies.",
    cta: "Book Online Now",
    badge: null,
    urgent: false
  };

  const uiCopy = capacity?.ui_copy || defaultCopy;
  const showFeeWaived = capacity?.overall.state === 'SAME_DAY_FEE_WAIVED';
  const isUrgent = uiCopy.urgent || showFeeWaived;

  return (
    <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-12 sm:py-16 lg:py-20 bg-pipes-blue relative overflow-hidden" style={{ backgroundBlendMode: 'overlay' }}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Dynamic Badge */}
            {uiCopy.badge && (
              <div className="mb-4">
                <Badge 
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-bold
                    ${isUrgent 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                      : 'bg-orange-500 text-white'}
                  `}
                  data-testid="capacity-badge"
                >
                  {isUrgent && <AlertCircle className="mr-2 h-4 w-4" />}
                  {uiCopy.badge}
                </Badge>
              </div>
            )}

            {/* Dynamic Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              {capacity ? (
                <>
                  {uiCopy.headline}
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">
                    Abington & Quincy, MA
                  </span>
                </>
              ) : (
                <>
                  Expert Plumbing Services in 
                  <span className="text-johnson-orange"> Abington & Quincy, MA</span>
                </>
              )}
            </h2>

            {/* Dynamic Subhead */}
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-blue-100">
              {uiCopy.subhead}
            </p>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <Clock className={`h-5 w-5 flex-shrink-0 ${showFeeWaived ? 'text-red-400 animate-pulse' : 'text-johnson-orange'}`} />
                <span className="font-medium text-sm sm:text-base">
                  {showFeeWaived ? 'Same Day - Fee Waived!' : 'Same Day Service'}
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
                onClick={handleBookNow}
                className={`
                  px-6 py-4 sm:px-8 rounded-lg font-bold text-lg 
                  transition-all duration-300 transform hover:scale-105 shadow-xl 
                  w-full sm:w-auto touch-target
                  ${isUrgent 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse' 
                    : 'bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange'}
                `}
                data-testid="hero-book-online-button"
                disabled={isLoading}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {isLoading ? 'Checking Availability...' : uiCopy.cta}
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

            {/* Availability Indicator */}
            {capacity && (
              <div className="mt-4 text-sm text-blue-100">
                {capacity.overall.state === 'SAME_DAY_FEE_WAIVED' && (
                  <span className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4 animate-pulse" />
                    High availability today - emergency fee waived!
                  </span>
                )}
                {capacity.overall.state === 'LIMITED_SAME_DAY' && (
                  <span className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Limited spots available today
                  </span>
                )}
                {capacity.overall.state === 'NEXT_DAY' && (
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Next available: Tomorrow
                  </span>
                )}
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
            
            {/* Floating Service Badge - Dynamic based on state */}
            <div className="absolute -bottom-3 -left-3 sm:-bottom-6 sm:-left-6 bg-white p-3 sm:p-6 rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-johnson-blue" data-testid="service-fee">
                  {showFeeWaived ? 'FREE' : '$99'}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {showFeeWaived ? 'Emergency Fee' : 'Service Fee'}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {showFeeWaived ? 'Waived Today!' : 'Applied to repair cost'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}