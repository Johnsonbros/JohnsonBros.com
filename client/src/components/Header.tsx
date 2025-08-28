import { Phone, Star, Menu, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface HeaderProps {
  onBookService: () => void;
}

export default function Header({ onBookService }: HeaderProps) {
  const [isBusinessHours, setIsBusinessHours] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Dynamic Plumbing Banner - Thinner on Mobile */}
      <a 
        href="tel:6174799911"
        className={`block w-full cursor-pointer hover:opacity-95 transition-opacity py-2 sm:py-3 lg:py-4 ${
          isBusinessHours 
            ? "bg-gradient-to-r from-green-600 to-green-500" 
            : "bg-gradient-to-r from-red-600 to-red-500"
        }`}
        data-testid="plumbing-banner-link"
      >
        <div className="text-center">
          <h2 className="text-white font-bold text-sm sm:text-lg lg:text-xl lg:mb-1">
            {isBusinessHours ? "EXPERT PLUMBERS READY TO HELP" : "24/7 EMERGENCY PLUMBING"}
          </h2>
          <p className="text-white font-semibold text-xs sm:text-sm lg:text-base flex items-center justify-center gap-2 lg:mt-0">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">CLICK HERE TO TALK TO A REAL PLUMBER</span>
            <span className="sm:hidden">TAP TO CALL NOW</span>
          </p>
        </div>
      </a>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-lg sticky top-0 z-50 border-t-2 border-johnson-blue">
        {/* Mobile Layout - Simplified */}
        <div className="lg:hidden px-4 py-2 flex justify-between items-center">
          {/* Logo - Smaller on Mobile */}
          <img 
            src="/JB_logo_New_1756136293648.png" 
            alt="Johnson Bros. Plumbing & Drain Cleaning" 
            className="h-12 w-auto max-w-[200px] object-contain"
            data-testid="company-logo"
          />
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[104px] bg-johnson-blue z-40" style={{ height: 'calc(100vh - 104px - 70px)' }}>
            <nav className="flex flex-col p-6 space-y-4">
              <a 
                href="#services" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-lg font-medium py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Services
              </a>
              <a 
                href="#about" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-lg font-medium py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                About Us
              </a>
              <a 
                href="#reviews" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-lg font-medium py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Reviews
              </a>
              <a 
                href="#contact" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-lg font-medium py-3 px-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                Contact
              </a>
              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-center space-x-2 bg-white/10 px-4 py-3 rounded-lg">
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <span className="text-white text-sm font-medium">4.8/5 (281 reviews)</span>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 px-4 py-3">
          <div className="flex gap-3">
            <button 
              onClick={onBookService}
              className="flex-1 bg-johnson-blue hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all duration-300 shadow-md text-base touch-target flex items-center justify-center gap-2"
              data-testid="bottom-book-service-button"
            >
              <Calendar className="h-5 w-5" />
              <span>BOOK SERVICE</span>
            </button>
            <a 
              href="tel:6174799911" 
              className="flex-1 bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange text-white py-3 rounded-lg font-bold transition-all duration-300 shadow-md text-base touch-target flex items-center justify-center gap-2"
              data-testid="bottom-call-button"
            >
              <Phone className="h-5 w-5" />
              <span>CALL NOW</span>
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
