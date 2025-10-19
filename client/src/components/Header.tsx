import { Phone, Star, Menu, X, Calendar, Shield, Award, Home as HomeIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onBookService?: () => void;
}

export default function Header({ onBookService }: HeaderProps) {
  const [isBusinessHours, setIsBusinessHours] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileAreasOpen, setMobileAreasOpen] = useState(false);

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

  const services = [
    { name: "Drain Cleaning", href: "/services/drain-cleaning" },
    { name: "Emergency Plumbing", href: "/services/emergency-plumbing" },
    { name: "Water Heater Service", href: "/services/water-heater" },
    { name: "Pipe Repair", href: "/services/pipe-repair" },
    { name: "General Plumbing", href: "/services/general-plumbing" },
    { name: "New Construction", href: "/services/new-construction" },
    { name: "Gas & Heat", href: "/services/gas-heat" },
  ];

  const serviceAreas = [
    { name: "Quincy, MA", href: "/service-areas/quincy" },
    { name: "Braintree, MA", href: "/service-areas/braintree" },
    { name: "Weymouth, MA", href: "/service-areas/weymouth" },
    { name: "Plymouth, MA", href: "/service-areas/plymouth" },
    { name: "Marshfield, MA", href: "/service-areas/marshfield" },
    { name: "Hingham, MA", href: "/service-areas/hingham" },
  ];

  return (
    <>
      {/* Trust Bar - Top of page */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center md:justify-between py-2 text-xs sm:text-sm">
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 w-full md:w-auto">
              {/* License */}
              <div className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">Licensed & Insured</span>
                <span className="hidden sm:inline text-gray-300">| MA #PC1673</span>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current text-yellow-400" />
                <span className="font-medium">4.9/5 Google Rating</span>
                <span className="hidden sm:inline text-gray-300">(200+ Reviews)</span>
              </div>
              
              {/* Family Owned */}
              <div className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">Family Owned Since 1997</span>
              </div>
              
              {/* Emergency Service - Hidden on mobile, shown on tablet+ */}
              <a href="tel:6174799911" className="hidden md:flex items-center gap-1 hover:text-yellow-400 transition-colors group">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
                <span className="font-medium group-hover:underline">24/7 Emergency: 617-479-9911</span>
              </a>
            </div>
          </div>
        </div>
      </div>

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
        <div className="lg:hidden px-2 py-1 flex justify-between items-center gap-1 relative z-50">
          {/* Logo - Larger image that extends towards hamburger */}
          <img 
            src="/JB_logo_New_1756136293648.png" 
            alt="Johnson Bros. Plumbing & Drain Cleaning" 
            className="h-20 w-auto object-contain"
            style={{ maxWidth: 'calc(100% - 50px)' }}
            data-testid="company-logo"
          />
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle menu"
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed left-0 right-0 bg-johnson-blue z-40 shadow-2xl overflow-y-auto" style={{ top: '122px', bottom: '70px' }}>
            <nav className="flex flex-col p-3 space-y-0.5">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
              >
                Home
              </Link>

              {/* Mobile Services Dropdown */}
              <div className="text-white">
                <button
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="w-full text-left text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200 flex items-center justify-between"
                >
                  <span>Services</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileServicesOpen && (
                  <div className="pl-4 space-y-0.5 mt-1">
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-blue-100 text-sm py-2.5 px-4 hover:bg-white/10 rounded-lg transition-all duration-200"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Service Areas Dropdown */}
              <div className="text-white">
                <button
                  onClick={() => setMobileAreasOpen(!mobileAreasOpen)}
                  className="w-full text-left text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200 flex items-center justify-between"
                >
                  <span>Service Areas</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileAreasOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileAreasOpen && (
                  <div className="pl-4 space-y-0.5 mt-1">
                    {serviceAreas.map((area) => (
                      <Link
                        key={area.href}
                        href={area.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-blue-100 text-sm py-2.5 px-4 hover:bg-white/10 rounded-lg transition-all duration-200"
                      >
                        {area.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link 
                href="/family-discount" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
                data-testid="mobile-nav-family-discount"
              >
                The Family Discount
              </Link>
              <Link 
                href="/blog" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
                data-testid="mobile-nav-blog"
              >
                Blog
              </Link>
              <Link 
                href="/contact" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
                data-testid="mobile-nav-contact"
              >
                Contact
              </Link>
              <Link 
                href="/referral" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
                data-testid="mobile-nav-referral"
              >
                Referral Program
              </Link>
              <Link 
                href="/check-ins" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
                data-testid="mobile-nav-checkins"
              >
                Live Activity
              </Link>
              
              {/* Reviews Section - Redesigned */}
              <div className="pt-4 pb-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex text-yellow-400 space-x-1">
                      <Star className="h-6 w-6 fill-current drop-shadow-md" />
                      <Star className="h-6 w-6 fill-current drop-shadow-md" />
                      <Star className="h-6 w-6 fill-current drop-shadow-md" />
                      <Star className="h-6 w-6 fill-current drop-shadow-md" />
                      <Star className="h-6 w-6 fill-current drop-shadow-md" />
                    </div>
                    <div className="text-center">
                      <span className="text-white text-xl font-black block">4.8 out of 5</span>
                      <span className="text-blue-100 text-sm font-medium">281 Google Reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 px-4 py-3">
          <div className="flex gap-3">
            {onBookService ? (
              <button 
                onClick={onBookService}
                className="flex-1 bg-johnson-blue hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all duration-300 shadow-md text-base touch-target flex items-center justify-center gap-2"
                data-testid="bottom-book-service-button"
              >
                <Calendar className="h-5 w-5" />
                <span>BOOK SERVICE</span>
              </button>
            ) : (
              <Link 
                href="/#booking"
                className="flex-1 bg-johnson-blue hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all duration-300 shadow-md text-base touch-target flex items-center justify-center gap-2"
                data-testid="bottom-book-service-link"
              >
                <Calendar className="h-5 w-5" />
                <span>BOOK SERVICE</span>
              </Link>
            )}
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
        <div className="hidden lg:block">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center gap-8">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <img 
                  src="/JB_logo_New_1756136293648.png" 
                  alt="Johnson Bros. Plumbing & Drain Cleaning" 
                  className="h-16 w-auto"
                  data-testid="company-logo-desktop"
                />
              </div>

              {/* Desktop Navigation */}
              <nav className="flex items-center space-x-4 xl:space-x-6 flex-1 justify-center">
                <Link href="/" className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap">
                  Home
                </Link>

                {/* Desktop Services Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap flex items-center gap-1 outline-none">
                    Services
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {services.map((service) => (
                      <DropdownMenuItem key={service.href} asChild>
                        <Link href={service.href} className="cursor-pointer">
                          {service.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Desktop Service Areas Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap flex items-center gap-1 outline-none">
                    Service Areas
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {serviceAreas.map((area) => (
                      <DropdownMenuItem key={area.href} asChild>
                        <Link href={area.href} className="cursor-pointer">
                          {area.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/family-discount" className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap" data-testid="desktop-nav-family-discount">
                  Family Discount
                </Link>
                <Link href="/blog" className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap" data-testid="desktop-nav-blog">
                  Blog
                </Link>
                <Link href="/contact" className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap" data-testid="desktop-nav-contact">
                  Contact
                </Link>
                <Link href="/referral" className="text-white hover:text-blue-200 transition-colors font-medium text-sm xl:text-base whitespace-nowrap" data-testid="desktop-nav-referral">
                  Referral
                </Link>
              </nav>

              {/* Desktop CTA Buttons */}
              <div className="flex items-center space-x-3 xl:space-x-4 flex-shrink-0">
                <div className="flex items-center space-x-2 xl:space-x-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-3 xl:px-4 py-2 xl:py-3 rounded-xl border border-white/20 shadow-lg hover:from-white/25 hover:to-white/15 transition-all duration-300">
                  <div className="flex text-yellow-400 space-x-0.5">
                    <Star className="h-4 w-4 xl:h-5 xl:w-5 fill-current drop-shadow-sm" />
                    <Star className="h-4 w-4 xl:h-5 xl:w-5 fill-current drop-shadow-sm" />
                    <Star className="h-4 w-4 xl:h-5 xl:w-5 fill-current drop-shadow-sm" />
                    <Star className="h-4 w-4 xl:h-5 xl:w-5 fill-current drop-shadow-sm" />
                    <Star className="h-4 w-4 xl:h-5 xl:w-5 fill-current drop-shadow-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-base xl:text-lg font-bold leading-none" data-testid="rating-display">4.8/5</span>
                    <span className="text-blue-100 text-xs font-medium opacity-90">281 reviews</span>
                  </div>
                </div>
                {onBookService ? (
                  <Button 
                    onClick={onBookService}
                    className="bg-gradient-to-r from-johnson-orange to-orange-500 text-white px-4 xl:px-6 py-2 xl:py-3 rounded-lg font-bold hover:from-orange-500 hover:to-johnson-orange transition-all duration-300 transform hover:scale-105 shadow-lg text-sm xl:text-base whitespace-nowrap"
                    data-testid="header-book-service-button-desktop"
                  >
                    Book Service
                  </Button>
                ) : (
                  <Link href="/#booking">
                    <Button 
                      className="bg-gradient-to-r from-johnson-orange to-orange-500 text-white px-4 xl:px-6 py-2 xl:py-3 rounded-lg font-bold hover:from-orange-500 hover:to-johnson-orange transition-all duration-300 transform hover:scale-105 shadow-lg text-sm xl:text-base whitespace-nowrap"
                      data-testid="header-book-service-link-desktop"
                    >
                      Book Service
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
