import { AlertTriangle, Phone, Clock, Shield, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface EmergencyHeroProps {
  onBookService: () => void;
  headline?: string;
  subheadline?: string;
  showAvailability?: boolean;
}

export function EmergencyHero({ 
  onBookService, 
  headline = "24/7 EMERGENCY PLUMBING SERVICE",
  subheadline = "Burst pipes? Major leak? Flooding? We're on the way!",
  showAvailability = true 
}: EmergencyHeroProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [viewerCount, setViewerCount] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate viewer count
  useEffect(() => {
    setViewerCount(Math.floor(Math.random() * 5) + 3);
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(2, prev + Math.floor(Math.random() * 3) - 1));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white py-8 sm:py-12 lg:py-16 overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/50 to-transparent animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Emergency Alert Bar */}
        <div className="bg-yellow-400 text-red-900 rounded-lg px-4 py-2 mb-4 animate-pulse">
          <div className="flex items-center justify-center gap-2 font-bold text-sm sm:text-base">
            <AlertTriangle className="h-5 w-5" />
            <span>EMERGENCY SERVICE AVAILABLE NOW</span>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            {/* Urgency Badge */}
            <Badge className="bg-white text-red-600 mb-4 px-4 py-2 text-sm font-bold animate-bounce inline-flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              IMMEDIATE RESPONSE AVAILABLE
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              {headline}
              <span className="block text-yellow-400 text-3xl sm:text-4xl mt-2 animate-pulse">
                GET HELP NOW!
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl mb-6 text-red-100">
              {subheadline}
            </p>

            {/* Emergency Benefits */}
            <div className="bg-red-800/50 backdrop-blur rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Available Now</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">30 Min Response</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">24/7 Service</span>
                </div>
              </div>
            </div>

            {/* Live Availability Indicator */}
            {showAvailability && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{viewerCount} people viewing now</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-400">
                    2 techs available
                  </div>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onBookService}
                size="lg"
                className="bg-white text-red-600 hover:bg-red-50 font-bold text-lg px-8 py-6 shadow-2xl transform hover:scale-105 transition-all duration-200"
                data-testid="emergency-book-now"
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                GET EMERGENCY HELP NOW
                <ArrowRight className="ml-2 h-5 w-5 animate-pulse" />
              </Button>
              
              <a
                href="tel:6174799911"
                className="flex items-center justify-center gap-2 bg-yellow-400 text-red-900 hover:bg-yellow-300 font-bold text-lg px-8 py-6 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
                data-testid="emergency-call-now"
              >
                <Phone className="h-6 w-6 animate-pulse" />
                CALL NOW: (617) 479-9911
              </a>
            </div>

            {/* Countdown Timer */}
            <div className="mt-6 bg-red-900/50 backdrop-blur rounded-lg p-3 border border-red-500">
              <div className="text-center">
                <p className="text-xs font-medium text-red-200 mb-2">EMERGENCY FEE WAIVED FOR:</p>
                <div className="flex items-center justify-center gap-3 text-2xl font-bold text-yellow-400">
                  <div>
                    <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-xs block text-red-200">HRS</span>
                  </div>
                  <span>:</span>
                  <div>
                    <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-xs block text-red-200">MIN</span>
                  </div>
                  <span>:</span>
                  <div>
                    <span className="tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-xs block text-red-200">SEC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Emergency Image/Visual */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000"
                alt="Emergency plumbing service"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent" />
              
              {/* Overlay Stats */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-red-900/80 backdrop-blur rounded p-3">
                    <div className="text-2xl font-bold text-yellow-400">30min</div>
                    <div className="text-xs">AVG RESPONSE</div>
                  </div>
                  <div className="bg-red-900/80 backdrop-blur rounded p-3">
                    <div className="text-2xl font-bold text-yellow-400">24/7</div>
                    <div className="text-xs">AVAILABLE</div>
                  </div>
                  <div className="bg-red-900/80 backdrop-blur rounded p-3">
                    <div className="text-2xl font-bold text-yellow-400">5000+</div>
                    <div className="text-xs">EMERGENCIES</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Emergency Badge */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-red-900 rounded-full p-4 shadow-2xl animate-bounce">
              <div className="text-center">
                <Phone className="h-8 w-8 mx-auto" />
                <div className="text-xs font-bold mt-1">CALL NOW</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}