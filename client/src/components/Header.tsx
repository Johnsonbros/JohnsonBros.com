import { Phone, Star, PhoneCall, AlertCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface HeaderProps {
  onBookService: () => void;
}

export default function Header({ onBookService }: HeaderProps) {
  const [isBusinessHours, setIsBusinessHours] = useState(false);

  const checkBusinessHours = () => {
    const now = new Date();
    // Convert to EST timezone
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const day = estTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = estTime.getHours();
    
    // Monday (1) to Friday (5), 8am (8) to 5pm (17)
    const isWeekday = day >= 1 && day <= 5;
    const isDuringHours = hour >= 8 && hour < 17;
    
    return isWeekday && isDuringHours;
  };

  useEffect(() => {
    const updateBusinessHours = () => {
      setIsBusinessHours(checkBusinessHours());
    };
    
    // Check immediately
    updateBusinessHours();
    
    // Check every minute
    const interval = setInterval(updateBusinessHours, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Dynamic Business Hours Banner - Mobile Optimized */}
      <div className={`relative overflow-hidden transition-all duration-500 ${
        isBusinessHours 
          ? 'bg-gradient-to-r from-johnson-blue to-blue-600' 
          : 'bg-gradient-to-r from-red-600 to-red-700'
      }`}>
        {/* Subtle animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        
        {/* Mobile-First Layout */}
        <div className="px-3 py-2 sm:py-3 sm:px-4 relative z-10">
          <div className="flex items-center justify-between gap-2">
            {/* Simplified Message for Mobile */}
            <div className="flex items-center gap-2">
              <PhoneCall className={`h-5 w-5 sm:h-6 sm:w-6 text-white ${isBusinessHours ? 'animate-pulse' : 'animate-pulse-slow'}`} />
              <div className="text-white">
                <p className="text-sm sm:text-base font-bold leading-tight">
                  {isBusinessHours 
                    ? <><span className="sm:hidden">Real Plumbers</span><span className="hidden sm:inline">Real Plumbers Answer • No Call Centers</span></>
                    : <><span className="sm:hidden">24/7 Emergency</span><span className="hidden sm:inline">24/7 Emergency • Real Plumbers On-Call</span></>
                  }
                </p>
              </div>
            </div>
            
            {/* Prominent Mobile Call Button */}
            <a 
              href="tel:6174799911" 
              className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-sm sm:text-base transition-all transform active:scale-95 shadow-lg ${
                isBusinessHours
                  ? 'bg-white text-johnson-blue hover:bg-johnson-orange hover:text-white'
                  : 'bg-johnson-orange text-white hover:bg-orange-500 animate-pulse-slow'
              }`}
              data-testid="call-now-button"
            >
              <PhoneCall className="h-4 w-4 mr-1 sm:hidden" />
              <span className="whitespace-nowrap">
                <span className="sm:hidden">CALL NOW</span>
                <span className="hidden sm:inline">Tap to Call</span>
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-xl sticky top-0 z-50">
        {/* Mobile Layout - Optimized for Touch */}
        <div className="lg:hidden">
          {/* Logo Section - Compact for Mobile */}
          <div className="px-3 pt-3 pb-2 bg-white/10">
            <img 
              src="/JB_logo_New_1756136293648.png" 
              alt="Johnson Bros. Plumbing & Drain Cleaning" 
              className="h-16 w-auto mx-auto object-contain"
              data-testid="company-logo"
            />
          </div>
          
          {/* Mobile Action Buttons - Large and Prominent */}
          <div className="px-3 pb-3 pt-1">
            <div className="space-y-2">
              {/* Primary Call Button - Most Prominent */}
              <a 
                href="tel:6174799911" 
                className="w-full bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-xl text-lg active:scale-98 text-center flex items-center justify-center relative overflow-hidden group"
                data-testid="mobile-call-button"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-active:translate-x-full transition-transform duration-500"></div>
                <PhoneCall className="h-5 w-5 mr-2 animate-pulse" />
                <span className="relative">TAP TO CALL NOW</span>
              </a>
              
              {/* Secondary Book Service Button */}
              <Button 
                onClick={onBookService}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg text-base border-2 border-white/30 active:scale-98"
                data-testid="header-book-service-button"
              >
                <CalendarClock className="h-5 w-5 mr-2 inline" />
                BOOK SERVICE ONLINE
              </Button>
            </div>
            
            {/* Trust Indicators - Compact Mobile Version */}
            <div className="flex items-center justify-center mt-3 gap-3">
              <div className="flex items-center bg-white/10 px-2 py-1 rounded-lg">
                <div className="flex text-yellow-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="text-white text-xs font-medium ml-1">4.8</span>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded-lg">
                <span className="text-white text-xs font-medium">Since 1985</span>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded-lg">
                <span className="text-white text-xs font-medium">Licensed & Insured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="container mx-auto px-4 py-3">

          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/JB_logo_New_1756136293648.png" 
                alt="Johnson Bros. Plumbing & Drain Cleaning" 
                className="h-18 w-auto"
                data-testid="company-logo-desktop"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="flex space-x-8">
              <a href="#services" className="text-white hover:text-blue-200 transition-colors font-medium">Services</a>
              <a href="#about" className="text-white hover:text-blue-200 transition-colors font-medium">About</a>
              <a href="#reviews" className="text-white hover:text-blue-200 transition-colors font-medium">Reviews</a>
              <a href="#contact" className="text-white hover:text-blue-200 transition-colors font-medium">Contact</a>
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                <div className="flex text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <span className="text-white text-sm font-medium" data-testid="rating-display">4.8/5 (281 reviews)</span>
              </div>
              <Button 
                onClick={onBookService}
                className="bg-gradient-to-r from-johnson-orange to-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:from-orange-500 hover:to-johnson-orange transition-all duration-300 transform hover:scale-105 shadow-lg text-base"
                data-testid="header-book-service-button-desktop"
              >
                Book Service
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
