import { Phone, Star } from "lucide-react";
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
      {/* Dynamic Plumbing Banner */}
      <a 
        href="tel:6174799911"
        className={`block w-full cursor-pointer hover:opacity-95 transition-opacity py-3 sm:py-4 ${
          isBusinessHours 
            ? "bg-gradient-to-r from-green-600 to-green-500" 
            : "bg-gradient-to-r from-red-600 to-red-500"
        }`}
        data-testid="plumbing-banner-link"
      >
        <div className="text-center">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-1">
            {isBusinessHours ? "EXPERT PLUMBERS READY TO HELP" : "24/7 EMERGENCY PLUMBING"}
          </h2>
          <p className="text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            CLICK HERE TO TALK TO A REAL PLUMBER
          </p>
        </div>
      </a>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-lg sticky top-0 z-50 border-t-2 border-johnson-blue">
        {/* Mobile Layout - Full Width */}
        <div className="lg:hidden px-2 pt-1">
          {/* Logo - Full Width on Mobile */}
          <div>
            <img 
              src="/JB_logo_New_1756136293648.png" 
              alt="Johnson Bros. Plumbing & Drain Cleaning" 
              className="h-12 w-full object-contain"
              data-testid="company-logo"
            />
          </div>
          
          {/* Mobile Buttons Underneath Logo - Full Width */}
          <div className="flex gap-1 -mx-2 px-2">
            <Button 
              onClick={onBookService}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-bold transition-all duration-300 shadow-lg text-xs touch-target"
              data-testid="header-book-service-button"
            >
              BOOK SERVICE
            </Button>
            <a 
              href="tel:6174799911" 
              className="flex-1 bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange text-white py-2 rounded-md font-bold transition-all duration-300 shadow-lg text-xs touch-target text-center flex items-center justify-center"
              data-testid="mobile-call-button"
            >
              TAP HERE TO CALL
            </a>
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
