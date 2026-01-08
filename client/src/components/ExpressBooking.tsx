import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, Shield, DollarSign, Calendar, Phone, MapPin, Zap, ChevronRight, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { formatTimeSlotWindow } from "@/lib/timeUtils";
import { format, addDays } from "date-fns";
import plumberVideo from "@assets/Website video_1759942431968.mp4";

interface HeroSectionProps {
  onBookService: () => void;
}

interface ExpressWindow {
  time_slot: string;
  available_techs: string[];
  start_time: string;
  end_time: string;
}

interface CapacityData {
  overall: {
    score: number;
    state: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY' | 'EMERGENCY_ONLY';
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
  unique_express_windows?: ExpressWindow[];
}

export default function ExpressBooking({ onBookService }: HeroSectionProps) {
  const [userZip, setUserZip] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<ExpressWindow | null>(null);
  
  // Fetch today's capacity data (using v1 API endpoint)
  const { data: todayCapacity } = useQuery<CapacityData>({
    queryKey: ['/api/v1/capacity/today', userZip],
    queryFn: async () => {
      const url = userZip ? `/api/v1/capacity/today?zip=${userZip}` : '/api/v1/capacity/today';
      const response = await apiRequest("GET", url);
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  // Check if we should show today or tomorrow based on available slots
  const shouldShowTomorrow = todayCapacity?.overall.state === 'NEXT_DAY' || 
    (todayCapacity?.unique_express_windows?.length === 0);
  
  // Fetch tomorrow's capacity data if today has no slots (using v1 API endpoint)
  const { data: tomorrowCapacity } = useQuery<CapacityData>({
    queryKey: ['/api/v1/capacity/tomorrow', userZip],
    queryFn: async () => {
      const url = userZip ? `/api/v1/capacity/tomorrow?zip=${userZip}` : '/api/v1/capacity/tomorrow';
      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: shouldShowTomorrow,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const storedZip = localStorage.getItem('user_zip');
    if (storedZip) {
      setUserZip(storedZip);
    }
  }, []);

  const handleTimeSlotBooking = (slot: ExpressWindow, isNextDay: boolean = false) => {
    sessionStorage.setItem('booking_type', isNextDay ? 'next_day' : 'express');
    sessionStorage.setItem('booking_time_slot', slot.time_slot);
    sessionStorage.setItem('booking_available_techs', JSON.stringify(slot.available_techs));
    sessionStorage.setItem('booking_promo', 'FEEWAIVED_SAMEDAY');
    sessionStorage.setItem('booking_utm_source', 'site');
    sessionStorage.setItem('booking_utm_campaign', isNextDay ? 'next_day_guarantee' : 'express_booking');
    sessionStorage.setItem('booking_date', isNextDay ? 'tomorrow' : 'today');
    
    onBookService();
  };

  // Determine which capacity to use and booking type
  const isEmergency = todayCapacity?.overall.state === 'EMERGENCY_ONLY';
  const hasToday = todayCapacity && 
                    todayCapacity.overall.state !== 'NEXT_DAY' && 
                    todayCapacity.overall.state !== 'EMERGENCY_ONLY' &&
                    todayCapacity.unique_express_windows && 
                    todayCapacity.unique_express_windows.length > 0;
  const hasTomorrow = !hasToday && !isEmergency && tomorrowCapacity && 
                       tomorrowCapacity.unique_express_windows && 
                       tomorrowCapacity.unique_express_windows.length > 0;
  
  const activeCapacity = hasToday ? todayCapacity : hasTomorrow ? tomorrowCapacity : todayCapacity;
  const uniqueSlots = !isEmergency ? (activeCapacity?.unique_express_windows || []) : [];
  const isNextDay = hasTomorrow && !hasToday && !isEmergency;
  
  // Get the appointment date
  const appointmentDate = isNextDay ? addDays(new Date(), 1) : new Date();
  const dateDisplay = format(appointmentDate, 'EEEE, MMMM d');

  return (
    <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-8 sm:py-12 md:py-16 lg:py-20 bg-pipes-blue relative overflow-hidden" style={{ backgroundBlendMode: 'overlay' }}>
      {/* Animated background for express availability */}
      {(hasToday || hasTomorrow || isEmergency) && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>
      )}
      <div className="container mx-auto px-3 sm:px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div>
            {/* Express, Next Day, or Emergency Badge */}
            {activeCapacity && (
              <div className="mb-4">
                <Badge 
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-bold
                    ${hasToday 
                      ? 'bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/50' 
                      : hasTomorrow
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                        : isEmergency
                          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                          : 'bg-orange-500 text-white'}
                  `}
                  data-testid="express-badge"
                >
                  {hasToday ? (
                    <>
                      <Zap className="mr-2 h-4 w-4 animate-bounce" />
                      Express - $99 Fee Waived
                    </>
                  ) : hasTomorrow ? (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Next Day Guarantee - $99 Fee Waived
                    </>
                  ) : isEmergency ? (
                    <>
                      <Phone className="mr-2 h-4 w-4 animate-bounce" />
                      24/7 Emergency Service
                    </>
                  ) : (
                    'Schedule Service'
                  )}
                </Badge>
              </div>
            )}

            <p className="text-sm sm:text-base font-semibold text-blue-100 mb-3">
              Trusted Plumber in Quincy, MA • Plumbing • Heating • Drain Cleaning
            </p>

            {/* Dynamic Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              {hasToday ? (
                <>
                  Express Booking Available!
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">Now Booking Appointments</span>
                </>
              ) : hasTomorrow ? (
                <>
                  Next Day Appointment Guarantee
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">
                    Abington & Quincy, MA
                  </span>
                </>
              ) : isEmergency ? (
                <>
                  24/7 Emergency Service Available
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">
                    Call Now: (617) 479-9911
                  </span>
                </>
              ) : (
                <>
                  Schedule Your Service
                  <span className="text-johnson-orange block text-2xl sm:text-3xl lg:text-4xl mt-2">
                    Quincy, Greater Boston & the South Shore
                  </span>
                </>
              )}
            </h2>

            {/* Dynamic Subhead */}
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-blue-100">
              {hasToday 
                ? "Book now for same-day plumbing, heating, or drain cleaning with the $99 service fee waived."
                : hasTomorrow
                  ? "Reserve a guaranteed appointment tomorrow for Quincy, Greater Boston, and the South Shore with the $99 service fee waived."
                  : isEmergency
                    ? "Emergency plumbing help is available 24/7 across Quincy, Greater Boston, and the South Shore. Call or text anytime."
                    : "Fast, reliable service with real-time scheduling, trusted by Quincy, Greater Boston, and the South Shore homeowners."}
            </p>

            {/* Time Slot Selection */}
            {uniqueSlots.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-green-400 animate-pulse mr-2" />
                    <span className="font-semibold text-green-100">
                      {uniqueSlots.length} Time Slot{uniqueSlots.length > 1 ? 's' : ''} Available {isNextDay ? 'Tomorrow' : 'Today'}
                    </span>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    $99 Fee Waived
                  </Badge>
                </div>
                
                {/* Time Slot Buttons */}
                <div className="space-y-2">
                  {uniqueSlots.map((slot, idx) => {
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTimeSlotBooking(slot, isNextDay)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-102 
                          ${selectedTimeSlot?.time_slot === slot.time_slot 
                            ? 'bg-green-500 border-green-400 text-white shadow-lg' 
                            : 'bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/50'}`}
                        data-testid={`time-slot-${idx}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5" />
                            <div className="text-left">
                              <div className="font-bold text-lg">
                                {formatTimeSlotWindow(slot.start_time, slot.end_time)}
                              </div>
                              <div className="text-sm opacity-90">
                                {dateDisplay}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-600 text-white">
                              Book Now
                            </Badge>
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Priority Assignment Notice */}
                <div className="mt-3 flex items-start text-xs text-blue-200">
                  <Star className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>Our expert technicians will be assigned based on expertise and availability</span>
                </div>
              </div>
            )}
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <Clock className={`h-5 w-5 flex-shrink-0 ${hasToday ? 'text-green-400 animate-pulse' : isEmergency ? 'text-red-400 animate-pulse' : 'text-johnson-orange'}`} />
                <span className="font-medium text-sm sm:text-base">
                  {hasToday ? 'Express Same-Day' : hasTomorrow ? 'Next Day Guarantee' : isEmergency ? '24/7 Emergency' : 'Same Day Service'}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <Shield className="h-5 w-5 text-johnson-orange flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                <DollarSign className="h-5 w-5 text-johnson-orange flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{isEmergency ? 'Emergency Rates Apply' : '1-Year Parts Warranty'}</span>
              </div>
            </div>

            {/* CTA Buttons - Emergency call prompt or booking */}
            {isEmergency ? (
              <div className="flex flex-col space-y-3 sm:space-y-4">
                <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <Phone className="h-6 w-6 text-red-400 animate-bounce mr-2" />
                    <span className="font-bold text-lg text-red-100">Emergency Service Available</span>
                  </div>
                  <p className="text-sm text-blue-200">
                    Our emergency plumbers are standing by to help with your urgent plumbing needs.
                  </p>
                </div>
                <a 
                  href="tel:6174799911" 
                  className="bg-red-500 text-white px-6 py-4 sm:px-8 rounded-lg font-bold text-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-xl text-center inline-flex items-center justify-center w-full sm:w-auto touch-target animate-pulse"
                  data-testid="emergency-call-button"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now: (617) 479-9911
                </a>
                <div className="text-sm text-blue-200 text-center">
                  Available 24/7 for emergency plumbing services
                </div>
              </div>
            ) : uniqueSlots.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={onBookService}
                  className="px-6 py-4 sm:px-8 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl w-full sm:w-auto touch-target bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange"
                  data-testid="express-booking-button"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Service
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-johnson-blue text-lg px-8 py-4 w-full sm:w-auto font-bold shadow-xl transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <Link href="/service-areas">
                    View Service Areas
                  </Link>
                </Button>
              </div>
            )}

            {/* Call Option (shown for express/next day bookings) */}
            {uniqueSlots.length > 0 && !isEmergency && (
              <div className="mt-4">
                <div className="text-sm text-blue-200 mb-2">Prefer to book by phone?</div>
                <a 
                  href="tel:6174799911" 
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition-all duration-300 inline-flex items-center border border-white/30"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call (617) 479-9911
                </a>
              </div>
            )}

          </div>

          <div className="relative mt-8 lg:mt-0 flex flex-col items-center sm:block">
            {/* Express Video Preview for Desktop View */}
            <div className="hidden lg:block relative w-full aspect-video rounded-xl overflow-hidden shadow-xl border-4 border-white/20">
              <video 
                src={plumberVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                aria-label="Professional plumber at work"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">Live Service Feed</span>
              </div>

              {/* Floating Service Badge - Positioned bottom right of the video on desktop */}
              <div className={`absolute bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 z-20 ${hasToday || hasTomorrow ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}>
                <div className="text-center">
                  {hasToday ? (
                    <>
                      <Zap className="h-6 w-6 text-green-500 mx-auto mb-1 animate-bounce" />
                      <div className="text-lg font-bold text-green-600 leading-tight">EXPRESS</div>
                      <div className="text-[10px] text-gray-600 uppercase font-bold">Same-Day</div>
                      <div className="mt-1 bg-green-50 rounded p-1">
                        <div className="text-sm font-bold text-green-600">FREE FEE</div>
                      </div>
                    </>
                  ) : hasTomorrow ? (
                    <>
                      <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-600 leading-tight">NEXT DAY</div>
                      <div className="text-[10px] text-gray-600 uppercase font-bold">Guaranteed</div>
                      <div className="mt-1 bg-green-50 rounded p-1">
                        <div className="text-sm font-bold text-green-600">FREE FEE</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-johnson-blue">$99</div>
                      <div className="text-[10px] text-gray-600 uppercase font-bold">Service Fee</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile-only Service Badge (Original position) */}
            <div className={`lg:hidden bg-white p-6 rounded-xl shadow-lg w-full sm:w-auto ${hasToday || hasTomorrow ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}>
              <div className="text-center">
                {hasToday ? (
                  <>
                    <Zap className="h-8 w-8 text-green-500 mx-auto mb-2 animate-bounce" />
                    <div className="text-xl sm:text-2xl font-bold text-green-600">EXPRESS</div>
                    <div className="text-xs sm:text-sm text-gray-600">Same-Day Service</div>
                    <div className="mt-2 bg-green-50 rounded-lg p-2">
                      <div className="text-base sm:text-lg font-bold text-gray-400 line-through">$99</div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">FREE</div>
                      <div className="text-xs text-green-700">Service Fee Waived!</div>
                    </div>
                  </>
                ) : hasTomorrow ? (
                  <>
                    <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">NEXT DAY</div>
                    <div className="text-xs sm:text-sm text-gray-600">Guaranteed</div>
                    <div className="mt-2 bg-green-50 rounded-lg p-2">
                      <div className="text-base sm:text-lg font-bold text-gray-400 line-through">$99</div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">FREE</div>
                      <div className="text-xs text-green-700">Service Fee Waived!</div>
                    </div>
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
