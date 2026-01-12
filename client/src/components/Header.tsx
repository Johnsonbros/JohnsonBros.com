import { Phone, Star, Menu, X, Calendar, Shield, Award, Home as HomeIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onBookService?: () => void;
}

interface GoogleReviewsData {
  reviews: any[];
  totalReviews: number;
  averageRating: number;
  locations: any[];
}

export default function Header({ onBookService }: HeaderProps) {
  const [isBusinessHours, setIsBusinessHours] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileAreasOpen, setMobileAreasOpen] = useState(false);

  // Fetch real-time Google reviews data
  const { data: reviewsData } = useQuery<GoogleReviewsData>({
    queryKey: ["/api/v1/google-reviews"],
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
    refetchOnWindowFocus: true,
  });

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
    { name: "All Areas", href: "/service-areas" },
    { name: "Quincy, MA", href: "/service-areas/quincy" },
    { name: "Braintree, MA", href: "/service-areas/braintree" },
    { name: "Weymouth, MA", href: "/service-areas/weymouth" },
    { name: "Plymouth, MA", href: "/service-areas/plymouth" },
    { name: "Marshfield, MA", href: "/service-areas/marshfield" },
    { name: "Hingham, MA", href: "/service-areas/hingham" },
  ];


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
        <div className="lg:hidden px-2 py-1 flex justify-between items-center gap-1 relative z-50">
          {/* Logo */}
          <img 
            src="/JB_logo_New_1756136293648.png" 
            alt="Johnson Bros. Plumbing & Drain Cleaning" 
            className="h-8 sm:h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain"
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
          <div className="lg:hidden fixed inset-x-0 bg-johnson-blue z-[60] shadow-2xl flex flex-col" style={{ top: '0px', bottom: '70px' }}>
            {/* Solid header with logo in mobile menu - stays fixed */}
            <div className="bg-johnson-blue px-2 py-1 flex justify-between items-center gap-1 border-b border-white/10 flex-shrink-0">
              <img 
                src="/JB_logo_New_1756136293648.png" 
                alt="Johnson Bros. Plumbing & Drain Cleaning" 
                className="h-8 sm:h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Scrollable navigation area */}
            <nav className="flex flex-col p-3 space-y-0.5 flex-1 overflow-y-auto min-h-0">
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
                    <Link
                      href="/service-areas"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-white font-bold text-sm py-2.5 px-4 hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      View All Areas Directory
                    </Link>
                    {serviceAreas.filter(a => a.href !== "/service-areas").map((area) => (
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
                href="/customer-portal" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-base font-semibold py-3.5 px-4 hover:bg-white/15 active:bg-white/25 rounded-lg transition-all duration-200"
                data-testid="mobile-nav-customer-portal"
              >
                Customer Portal
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
              
              {/* Reviews Section - Real-time Data */}
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
                      <span className="text-white text-xl font-black block">
                        {reviewsData?.averageRating?.toFixed(1) || "4.8"} out of 5
                      </span>
                      <span className="text-blue-100 text-sm font-medium">
                        {reviewsData?.totalReviews || "281"} Google Reviews
                      </span>
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
          <div className="container mx-auto px-3 py-1">
            <div className="flex justify-between items-center gap-3">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <img 
                  src="/JB_logo_New_1756136293648.png" 
                  alt="Johnson Bros. Plumbing & Drain Cleaning" 
                  className="h-8 w-auto max-w-[140px] object-contain"
                  data-testid="company-logo-desktop"
                />
              </div>

              {/* Desktop Navigation */}
              <nav className="flex items-center space-x-2 xl:space-x-3 flex-1 justify-center">
                <Link href="/" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap">
                  Home
                </Link>

                {/* Desktop Services Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap flex items-center gap-0.5 outline-none">
                    Services
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {services.map((service) => (
                      <DropdownMenuItem key={service.href} asChild>
                        <Link href={service.href} className="cursor-pointer text-sm">
                          {service.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Desktop Service Areas Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Link href="/service-areas" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap flex items-center gap-0.5 outline-none cursor-pointer">
                      Areas
                      <ChevronDown className="h-3 w-3" />
                    </Link>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/service-areas" className="cursor-pointer font-bold text-sm">
                        All Areas
                      </Link>
                    </DropdownMenuItem>
                    {serviceAreas.filter(a => a.href !== "/service-areas").map((area) => (
                      <DropdownMenuItem key={area.href} asChild>
                        <Link href={area.href} className="cursor-pointer text-sm">
                          {area.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/family-discount" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap" data-testid="desktop-nav-family-discount">
                  Family
                </Link>
                <Link href="/customer-portal" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap" data-testid="desktop-nav-customer-portal">
                  Portal
                </Link>
                <Link href="/blog" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap" data-testid="desktop-nav-blog">
                  Blog
                </Link>
                <Link href="/contact" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap" data-testid="desktop-nav-contact">
                  Contact
                </Link>
                <Link href="/referral" className="text-white hover:text-blue-200 transition-colors font-medium text-xs whitespace-nowrap" data-testid="desktop-nav-referral">
                  Referral
                </Link>
              </nav>

              {/* Desktop CTA Buttons */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="flex items-center space-x-1 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-2 py-1 rounded border border-white/20 shadow-sm">
                  <div className="flex text-yellow-400 space-x-0">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                  <span className="text-white text-xs font-bold" data-testid="rating-display">
                    {reviewsData?.averageRating?.toFixed(1) || "4.8"}
                  </span>
                </div>
                {onBookService ? (
                  <Button 
                    onClick={onBookService}
                    variant="brand-accent"
                    size="sm"
                    className="px-3 py-1 text-xs whitespace-nowrap h-7"
                    data-testid="header-book-service-button-desktop"
                  >
                    Book
                  </Button>
                ) : (
                  <Link href="/#booking">
                    <Button 
                      variant="brand-accent"
                      size="sm"
                      className="px-3 py-1 text-xs whitespace-nowrap h-7"
                      data-testid="header-book-service-link-desktop"
                    >
                      Book
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
