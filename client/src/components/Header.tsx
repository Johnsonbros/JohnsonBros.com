import { Phone, Star, PhoneCall, AlertCircle } from "lucide-react";
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
      {/* Dynamic Business Hours Banner - Integrated Design */}
      <div className={`relative overflow-hidden transition-all duration-500 ${
        isBusinessHours 
          ? 'bg-gradient-to-r from-johnson-blue/95 to-blue-700/95' 
          : 'bg-gradient-to-r from-red-600/95 to-red-700/95'
      }`}
        style={{
          backgroundImage: isBusinessHours ? 'url(/banner-bg.png)' : 'url(/banner-bg-emergency.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Subtle animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        
        <div className="container mx-auto py-3 px-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
            {/* Message Section */}
            <div className="flex items-center gap-2 text-black">
              <PhoneCall className={`h-6 w-6 ${isBusinessHours ? 'animate-pulse' : 'animate-pulse-slow'}`} />
              <div className="text-center sm:text-left">
                <p className="text-base sm:text-lg font-bold">
                  {isBusinessHours 
                    ? 'Real Plumbers Answer • No Call Centers'
                    : '24/7 Emergency • Real Plumbers On-Call'
                  }
                </p>
              </div>
            </div>
            
            {/* Call Button */}
            <a 
              href="tel:6174799911" 
              className={`group flex items-center justify-center px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-md touch-target ${
                isBusinessHours
                  ? 'bg-white/95 text-johnson-blue hover:bg-johnson-orange hover:text-white'
                  : 'bg-johnson-orange text-white hover:bg-orange-500 animate-pulse-slow'
              }`}
              data-testid="call-now-button"
            >
              <span className="text-base sm:text-lg">
                Tap to Call
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-lg sticky top-0 z-50 border-t-2 border-johnson-blue">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Logo - Full Width on Mobile */}
            <div className="flex justify-center mb-3">
              <img 
                src="/JB_logo_New_1756136293648.png" 
                alt="Johnson Bros. Plumbing & Drain Cleaning" 
                className="h-20 w-full max-w-[350px] object-contain"
                data-testid="company-logo"
              />
            </div>
            
            {/* Mobile Buttons Underneath Logo */}
            <div className="flex gap-2">
              <Button 
                onClick={onBookService}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-base touch-target"
                data-testid="header-book-service-button"
              >
                BOOK SERVICE
              </Button>
              <a 
                href="tel:6174799911" 
                className="flex-1 bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange text-white py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-base touch-target text-center"
                data-testid="mobile-call-button"
              >
                TAP HERE TO CALL
              </a>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/JB_logo_New_1756136293648.png" 
                alt="Johnson Bros. Plumbing & Drain Cleaning" 
                className="h-16 w-auto"
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
