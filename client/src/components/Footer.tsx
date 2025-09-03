import { Phone, Mail, MapPin, Facebook, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FooterProps {
  onBookService?: () => void;
}

export default function Footer({ onBookService }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4 sm:mb-6">
              <img 
                src="/JB_logo_New_1756136293648.png" 
                alt="Johnson Bros. Plumbing & Drain Cleaning" 
                className="h-12 sm:h-14 w-auto brightness-0 invert"
                data-testid="footer-company-logo"
              />
            </div>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              Professional plumbing services in Quincy, MA and surrounding areas. Licensed, insured, and committed to quality.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="footer-facebook-link"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="footer-google-link"
              >
                <Globe className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="footer-yelp-link"
              >
                <Star className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-6">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Emergency Plumbing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Drain Cleaning</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Water Heater Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pipe Repair</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fixture Installation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bathroom Remodeling</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Contact Info</h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-johnson-blue flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm sm:text-base" data-testid="footer-phone">(617) 479-9911</p>
                  <p className="text-xs sm:text-sm text-gray-400">24/7 Emergency Line (EST)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-johnson-blue flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm sm:text-base" data-testid="footer-email">info@johnsonbros.com</p>
                  <p className="text-xs sm:text-sm text-gray-400">Email Us</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-johnson-blue flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm sm:text-base" data-testid="footer-location">Abington & Quincy, MA</p>
                  <p className="text-xs sm:text-sm text-gray-400">Service Area</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 mb-6">
              <li><a href="/#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><a href="/#reviews" className="text-gray-400 hover:text-white transition-colors">Reviews</a></li>
              <li><a href="/#service-area" className="text-gray-400 hover:text-white transition-colors">Service Area</a></li>
              <li><a href="/#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
            
            {onBookService ? (
              <Button 
                onClick={onBookService}
                className="w-full bg-gradient-to-r from-johnson-orange to-orange-500 text-white px-4 py-3 rounded-lg font-bold hover:from-orange-500 hover:to-johnson-orange transition-all duration-300 transform hover:scale-105 shadow-lg touch-target"
                data-testid="footer-book-service-button"
              >
                Book Service Online
              </Button>
            ) : (
              <Link href="/#booking" className="w-full">
                <Button 
                  className="w-full bg-gradient-to-r from-johnson-orange to-orange-500 text-white px-4 py-3 rounded-lg font-bold hover:from-orange-500 hover:to-johnson-orange transition-all duration-300 transform hover:scale-105 shadow-lg touch-target"
                  data-testid="footer-book-service-link"
                >
                  Book Service Online
                </Button>
              </Link>
            )}
          </div>
        </div>

        <hr className="border-gray-700 my-12" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm" data-testid="footer-copyright">
            © 2024 Johnson Bros. Plumbing & Drain Cleaning. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
