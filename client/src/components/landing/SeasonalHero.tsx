import { Snowflake, Sun, CloudRain, Leaf, Calendar, ArrowRight, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface SeasonalHeroProps {
  onBookService: () => void;
  season?: 'winter' | 'summer' | 'spring' | 'fall';
  headline?: string;
  subheadline?: string;
  offerEndDate?: Date;
  discount?: number;
}

const seasonalData = {
  winter: {
    icon: Snowflake,
    bgGradient: "from-blue-600 via-blue-700 to-slate-800",
    accentColor: "text-cyan-400",
    bgImage: "https://images.unsplash.com/photo-1547608022-0ba2652f877e?q=80&w=2000",
    defaultHeadline: "Winter Pipe Protection Special",
    defaultSubheadline: "Prevent frozen pipes and costly damage with our winterization service",
    services: ["Pipe Insulation", "Leak Detection", "Water Heater Check", "Emergency Prep Kit"]
  },
  summer: {
    icon: Sun,
    bgGradient: "from-orange-500 via-orange-600 to-yellow-600",
    accentColor: "text-yellow-400",
    bgImage: "https://images.unsplash.com/photo-1561571994-3c61c2b509f1?q=80&w=2000",
    defaultHeadline: "Summer Plumbing Maintenance",
    defaultSubheadline: "Keep your plumbing running smoothly during the hot months",
    services: ["AC Drain Cleaning", "Outdoor Faucet Repair", "Sewer Line Check", "Water Pressure Adjust"]
  },
  spring: {
    icon: CloudRain,
    bgGradient: "from-green-500 via-green-600 to-teal-700",
    accentColor: "text-green-400",
    bgImage: "https://images.unsplash.com/photo-1520923642038-b4259de2f1d3?q=80&w=2000",
    defaultHeadline: "Spring Plumbing Inspection",
    defaultSubheadline: "Post-winter checkup to ensure everything is flowing properly",
    services: ["Sump Pump Service", "Gutter Drainage", "Pipe Inspection", "Water Heater Flush"]
  },
  fall: {
    icon: Leaf,
    bgGradient: "from-orange-600 via-red-600 to-amber-800",
    accentColor: "text-orange-400",
    bgImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000",
    defaultHeadline: "Fall Maintenance Special",
    defaultSubheadline: "Prepare your plumbing for the cold months ahead",
    services: ["Winterization", "Heating System Check", "Drain Cleaning", "Pipe Insulation"]
  }
};

export function SeasonalHero({
  onBookService,
  season = 'winter',
  headline,
  subheadline,
  offerEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  discount = 20
}: SeasonalHeroProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [temperature, setTemperature] = useState(32);
  
  const seasonData = seasonalData[season];
  const SeasonIcon = seasonData.icon;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = offerEndDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [offerEndDate]);

  // Animated temperature for winter
  useEffect(() => {
    if (season === 'winter') {
      const interval = setInterval(() => {
        setTemperature(prev => Math.max(10, prev - 1));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [season]);

  return (
    <section className={`relative bg-gradient-to-br ${seasonData.bgGradient} text-white py-12 sm:py-16 lg:py-20 overflow-hidden`}>
      {/* Seasonal Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${seasonData.bgImage})` }}
      />

      {/* Animated Seasonal Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <SeasonIcon
            key={i}
            className={`absolute ${seasonData.accentColor} opacity-20 animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              fontSize: `${Math.random() * 40 + 20}px`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Limited Time Offer Banner */}
        <div className="bg-red-600 text-white rounded-lg px-4 py-2 mb-6 max-w-fit mx-auto animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-5 w-5" />
            <span>LIMITED TIME: {discount}% OFF ALL SEASONAL SERVICES</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Season Badge */}
            <Badge className={`bg-white/20 backdrop-blur text-white mb-4 px-4 py-2 text-sm font-bold inline-flex items-center gap-2`}>
              <SeasonIcon className="h-4 w-4" />
              {season.toUpperCase()} SPECIAL
            </Badge>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {headline || seasonData.defaultHeadline}
              <span className={`block ${seasonData.accentColor} text-2xl sm:text-3xl mt-2`}>
                Save {discount}% This {season.charAt(0).toUpperCase() + season.slice(1)}!
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl mb-6 text-white/90">
              {subheadline || seasonData.defaultSubheadline}
            </p>

            {/* Weather Alert for Winter */}
            {season === 'winter' && (
              <Card className="bg-blue-900/50 backdrop-blur border-blue-400/30 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Snowflake className="h-8 w-8 text-cyan-400 animate-spin-slow" />
                    <div>
                      <p className="text-sm font-medium text-cyan-400">FREEZE WARNING</p>
                      <p className="text-xs text-white/80">Temperatures dropping to {temperature}°F</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <TrendingUp className="h-5 w-5 text-red-400 mb-1" />
                    <p className="text-xs font-bold text-red-400">High Risk</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Seasonal Services */}
            <Card className="bg-white/10 backdrop-blur border-white/20 p-6 mb-6">
              <h3 className="font-bold mb-3 text-white">Included Services:</h3>
              <div className="grid grid-cols-2 gap-3">
                {seasonData.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${seasonData.accentColor.replace('text', 'bg')}`} />
                    <span className="text-sm text-white/90">{service}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Offer Countdown */}
            <Card className="bg-gradient-to-r from-red-600 to-red-700 p-4 mb-6 border-0">
              <div className="text-center">
                <p className="text-xs font-medium text-white/90 mb-2">OFFER ENDS IN:</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-white/20 backdrop-blur rounded px-3 py-2">
                    <div className="text-2xl font-bold">{timeLeft.days}</div>
                    <div className="text-xs">DAYS</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded px-3 py-2">
                    <div className="text-2xl font-bold">{timeLeft.hours}</div>
                    <div className="text-xs">HRS</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded px-3 py-2">
                    <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-xs">MIN</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onBookService}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-xl transform hover:scale-105 transition-all duration-200"
                data-testid="seasonal-book-now"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Claim {discount}% Discount
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 font-bold text-lg px-8 py-6"
                data-testid="seasonal-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Column - Seasonal Visual */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <img
                src={seasonData.bgImage}
                alt={`${season} plumbing service`}
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Seasonal Stats Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h3 className="font-bold text-white mb-3">Why Act Now?</h3>
                  <div className="space-y-2 text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span>Prevention saves 75% on repair costs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-yellow-400" />
                      <span>Peak season approaching fast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-400" />
                      <span>Service requests up 200% this week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Discount Badge */}
            <div className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-6 shadow-2xl animate-bounce">
              <div className="text-center">
                <div className="text-3xl font-black">{discount}%</div>
                <div className="text-xs font-bold">OFF</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
      `}</style>
    </section>
  );
}