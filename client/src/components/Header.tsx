import { Phone, Wrench, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onBookService: () => void;
}

export default function Header({ onBookService }: HeaderProps) {
  return (
    <>
      {/* Emergency Banner */}
      <div className="bg-emergency-red text-white py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <span className="font-medium">24/7 Emergency Service Available</span>
          <a 
            href="tel:6174799911" 
            className="bg-white text-red-600 px-3 py-1 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            data-testid="emergency-call-button"
          >
            Call Now: (617) 479-9911
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-johnson-blue shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Wrench className="text-johnson-blue h-6 w-6" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl" data-testid="company-name">Johnson Bros.</h1>
                <p className="text-blue-100 text-sm">Plumbing & Drain Cleaning</p>
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
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
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
                className="bg-johnson-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors transform hover:scale-105"
                data-testid="header-book-service-button"
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
