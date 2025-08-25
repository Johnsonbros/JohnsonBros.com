import { Phone, Wrench, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onBookService: () => void;
}

export default function Header({ onBookService }: HeaderProps) {
  return (
    <>
      {/* Emergency Banner */}
      <div className="bg-emergency-red text-white py-3 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 text-sm">
          <span className="font-medium text-center sm:text-left">24/7 Emergency Service</span>
          <a 
            href="tel:6174799911" 
            className="bg-white text-red-600 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors touch-target"
            data-testid="emergency-call-button"
          >
            📞 (617) 479-9911
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Wrench className="text-johnson-blue h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg sm:text-xl" data-testid="company-name">Johnson Bros.</h1>
                <p className="text-blue-100 text-xs sm:text-sm">Plumbing & Drain</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              <a href="#services" className="text-white hover:text-blue-200 transition-colors font-medium">Services</a>
              <a href="#about" className="text-white hover:text-blue-200 transition-colors font-medium">About</a>
              <a href="#reviews" className="text-white hover:text-blue-200 transition-colors font-medium">Reviews</a>
              <a href="#contact" className="text-white hover:text-blue-200 transition-colors font-medium">Contact</a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden lg:flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                <div className="flex text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <span className="text-white text-sm font-medium" data-testid="rating-display">4.8/5 (281 reviews)</span>
              </div>
              <a 
                href="tel:6174799911" 
                className="md:hidden bg-white text-johnson-blue p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
                data-testid="mobile-call-button"
              >
                <Phone className="h-5 w-5" />
              </a>
              <Button 
                onClick={onBookService}
                className="bg-johnson-orange text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm sm:text-base touch-target"
                data-testid="header-book-service-button"
              >
                <span className="hidden sm:inline">Book Service</span>
                <span className="sm:hidden">Book</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
