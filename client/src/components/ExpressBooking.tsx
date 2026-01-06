import { useQuery } from "@tanstack/react-query";
import { Clock, Shield, DollarSign, Calendar, Phone, MapPin, Zap, ChevronRight, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
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
  
  // Fetch today's capacity data
  const { data: todayCapacity } = useQuery<CapacityData>({
    queryKey: ['/api/v1/capacity/today', userZip],
    queryFn: async () => {
      const url = userZip ? `/api/capacity/today?zip=${userZip}` : '/api/capacity/today';
      const response = await apiRequest("GET", url);
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  // Check if we should show today or tomorrow based on available slots
  const shouldShowTomorrow = todayCapacity?.overall.state === 'NEXT_DAY' || 
    (todayCapacity?.unique_express_windows?.length === 0);
  
  // Fetch tomorrow's capacity data if today has no slots
  const { data: tomorrowCapacity } = useQuery<CapacityData>({
    queryKey: ['/api/v1/capacity/tomorrow', userZip],
    queryFn: async () => {
      const url = userZip ? `/api/capacity/tomorrow?zip=${userZip}` : '/api/capacity/tomorrow';
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
  const isLoading = !todayCapacity && !tomorrowCapacity;
  const headline = activeCapacity?.ui_copy?.headline || "Schedule Service";
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 lg:p-10 shadow-xl border border-white/20">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight" data-testid="booking-headline">
                {headline}
              </h2>
              <p className="text-blue-100 text-base sm:text-lg mb-8 font-medium">
                Professional local plumbers. Upfront pricing. 
                <span className="block font-bold text-white mt-1 underline decoration-johnson-orange decoration-2">Guaranteed workmanship.</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live Availability</span>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="h-12 bg-white/10 rounded-xl animate-pulse"></div>
                      <div className="h-12 bg-white/10 rounded-xl animate-pulse"></div>
                    </div>
                  ) : uniqueSlots.length > 0 ? (
                    <div className="space-y-3">
                      {uniqueSlots.slice(0, 3).map((slot, index) => (
                        <button
                          key={`${slot.time_slot}`}
                          onClick={() => handleTimeSlotBooking(slot, isNextDay)}
                          className="w-full bg-white hover:bg-blue-50 text-johnson-blue p-4 rounded-xl font-bold flex items-center justify-between transition-all duration-300 group shadow-lg hover:shadow-johnson-blue/20"
                          data-testid={`slot-button-${index}`}
                        >
                          <div className="flex items-center">
                            <Calendar className="mr-3 h-5 w-5 text-johnson-blue/60" />
                            <div className="text-left">
                              <div className="text-sm">{dateDisplay}</div>
                              <div className="text-xs text-gray-500 font-medium">Arrival: {slot.start_time} - {slot.end_time}</div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                        </button>
                      ))}
                      <button
                        onClick={() => onBookService?.()}
                        className="w-full bg-johnson-orange hover:bg-orange-600 text-white p-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-orange-500/20 flex items-center justify-center gap-2"
                      >
                        <span>VIEW ALL TIMES</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                      <p className="text-white font-bold mb-2">High Demand Today</p>
                      <p className="text-sm text-blue-100/70 mb-4">We're currently handling several emergency calls in your area.</p>
                      <Button 
                        onClick={() => onBookService?.()}
                        className="w-full bg-white text-johnson-blue hover:bg-blue-50 font-bold py-4 rounded-xl"
                      >
                        CHECK LATEST OPENINGS
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-johnson-orange/20 p-2 rounded-lg">
                      <Shield className="h-6 w-6 text-johnson-orange" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Licensed & Insured</h3>
                      <p className="text-xs text-blue-100/70">Full protection for your home and peace of mind.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Award className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">4.9/5 Star Rating</h3>
                      <p className="text-xs text-blue-100/70">Trusted by over 10,000+ local homeowners.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Zap className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Fast Response</h3>
                      <p className="text-xs text-blue-100/70">Real-time scheduling with local technicians.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Option (shown for express/next day bookings) */}
              {uniqueSlots.length > 0 && !isEmergency && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <div className="text-sm font-semibold text-blue-200 uppercase tracking-wider mb-1">Prefer to book by phone?</div>
                      <p className="text-xs text-blue-100/70">Our dispatchers are standing by to help you schedule your service immediately.</p>
                    </div>
                    <div className="sm:text-right">
                      <a 
                        href="tel:6174799911" 
                        className="bg-white text-johnson-blue px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 inline-flex items-center shadow-lg group w-full sm:w-auto justify-center"
                      >
                        <Phone className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                        Call (617) 479-9911
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="relative mt-8 lg:mt-0 flex flex-col items-center sm:block">
            {/* Floating Service Badge - Now above video on mobile */}
            <div className={`mb-6 sm:mb-0 sm:absolute sm:bottom-2 sm:left-2 sm:-bottom-6 sm:-left-6 bg-white p-6 rounded-xl shadow-lg w-full sm:w-auto ${hasToday || hasTomorrow ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}>
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

            {/* Professional plumber working video */}
            <video 
              src={plumberVideo}
              autoPlay
              loop
              muted
              playsInline
              className="rounded-xl shadow-2xl w-full"
              aria-label="Professional plumber at work"
            />
          </div>
        </div>
      </div>
    </section>
  );
}