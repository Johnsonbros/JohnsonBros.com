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
      {/* Dynamic Business Hours Banner - Original Style */}
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
            {/* Message with Icon */}
            <div className="flex items-center gap-2">
              <PhoneCall className={`h-5 w-5 sm:h-6 sm:w-6 text-white ${isBusinessHours ? 'animate-pulse' : 'animate-pulse-slow'}`} />
              <div className="text-white">
                <p className="text-sm sm:text-base font-bold leading-tight">
                  {isBusinessHours 
                    ? 'Real Plumbers Answer • No Call Centers'
                    : '24/7 Emergency • Real Plumbers On-Call'
                  }
                </p>
              </div>
            </div>
            
            {/* Compact Call Button */}
            <a 
              href="tel:6174799911" 
              className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-sm sm:text-base transition-all transform active:scale-95 shadow-lg ${
                isBusinessHours
                  ? 'bg-white text-johnson-blue hover:bg-johnson-orange hover:text-white'
                  : 'bg-johnson-orange text-white hover:bg-orange-500 animate-pulse-slow'
              }`}
              data-testid="call-now-button"
            >
              <PhoneCall className="h-4 w-4 mr-1.5" />
              <span className="whitespace-nowrap">CALL NOW</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-xl sticky top-0 z-50">
        {/* Mobile Layout - Compact with Side-by-Side Buttons */}
        <div className="lg:hidden">
          {/* Logo Section - Compact for Mobile */}
          <div className="px-3 pt-3 pb-2">
            <img 
              src="/JB_logo_New_1756136293648.png" 
              alt="Johnson Bros. Plumbing & Drain Cleaning" 
              className="h-14 w-auto mx-auto object-contain"
              data-testid="company-logo"
            />
          </div>
          
          {/* Mobile Action Buttons - Side by Side */}
          <div className="px-3 pb-3">
            <div className="flex gap-2">
              {/* Call Button */}
              <a 
                href="tel:6174799911" 
                className="flex-1 bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-xl text-base active:scale-98 text-center flex items-center justify-center"
                data-testid="mobile-call-button"
              >
                <PhoneCall className="h-5 w-5 mr-1.5" />
                <span>TAP TO CALL NOW</span>
              </a>
              
              {/* Book Service Button */}
              <Button 
                onClick={onBookService}
                className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg text-base border-2 border-white/30 active:scale-98"
                data-testid="header-book-service-button"
              >
                <CalendarClock className="h-5 w-5 mr-1.5 inline" />
                BOOK SERVICE ONLINE
              </Button>
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
