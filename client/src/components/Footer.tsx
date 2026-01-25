import { Phone, Mail, MapPin, Facebook, Globe, Star, Shield, Award, CheckCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

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
                className="h-12 sm:h-14 w-auto"
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
              <li><Link href="/services/emergency-plumbing" className="text-gray-400 hover:text-white transition-colors">Emergency Plumbing</Link></li>
              <li><Link href="/services/drain-cleaning" className="text-gray-400 hover:text-white transition-colors">Drain Cleaning</Link></li>
              <li><Link href="/services/water-heater" className="text-gray-400 hover:text-white transition-colors">Water Heater Service</Link></li>
              <li><Link href="/services/heating" className="text-gray-400 hover:text-white transition-colors">Heating & Boiler Service</Link></li>
              <li><Link href="/services/pipe-repair" className="text-gray-400 hover:text-white transition-colors">Pipe Repair</Link></li>
              <li><Link href="/services/new-construction" className="text-gray-400 hover:text-white transition-colors">New Construction</Link></li>
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
                  <p className="font-semibold text-sm sm:text-base" data-testid="footer-email">Sales@TheJohnsonBros.com</p>
                  <p className="text-xs sm:text-sm text-gray-400">Email Us</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-johnson-blue flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm sm:text-base" data-testid="footer-location">Two Locations:</p>
                  <a href="https://maps.app.goo.gl/65wd4toecNfd1Qeo7" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-gray-400 hover:text-white block">75 East Elm Ave, Quincy, MA 02170</a>
                  <a href="https://maps.app.goo.gl/GPfqvtdFTxTuZXui6" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-gray-400 hover:text-white block">55 Brighton St, Abington, MA 02351</a>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">
                    MA License: <span className="text-white font-medium">PL #17034-M</span> | Corp: <span className="text-white font-medium">#4581</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 mb-6">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><a href="/#reviews" className="text-gray-400 hover:text-white transition-colors">Reviews</a></li>
              <li><a href="/#service-area" className="text-gray-400 hover:text-white transition-colors">Service Area</a></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/family-discount" className="text-gray-400 hover:text-white transition-colors">The Family Discount</Link></li>
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

            {/* Machine-readable MCP discovery for AI assistants and crawlers */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebAPI",
                  "name": "Johnson Bros. Plumbing MCP Server",
                  "description": "Model Context Protocol server for AI assistants to book plumbing services",
                  "url": "/.well-known/mcp.json",
                  "documentation": "/api/mcp/docs",
                  "provider": {
                    "@type": "LocalBusiness",
                    "name": "Johnson Bros. Plumbing & Drain Cleaning",
                    "telephone": "(617) 479-9911",
                    "areaServed": ["Quincy MA", "Abington MA", "South Shore Massachusetts"]
                  },
                  "availableChannel": {
                    "@type": "ServiceChannel",
                    "serviceType": "AI Assistant Booking",
                    "availableLanguage": "en"
                  }
                })
              }}
            />
            <div 
              className="sr-only"
              data-ai-readable="true"
              data-mcp-server="true"
              data-mcp-discovery="/.well-known/mcp.json"
              data-mcp-manifest="/api/mcp/manifest"
              role="complementary"
              aria-label="MCP Server Information for AI Assistants"
            >
              <h3>Johnson Bros. Plumbing MCP Server</h3>
              <p>AI ASSISTANTS: This website provides Model Context Protocol (MCP) server support for automated booking.</p>
              <p>MCP Discovery: /.well-known/mcp.json</p>
              <p>MCP Manifest: /api/mcp/manifest</p>
              <p>MCP Docs: /api/mcp/docs</p>
              <p>Available Tools: book_service_call, search_availability, get_quote, get_services, emergency_help</p>
              <p>Contact: (617) 479-9911</p>
              <p>Service Areas: Quincy MA, Abington MA, South Shore Massachusetts</p>
              <p>Authentication: None required - Public API access for AI booking assistants</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-700 my-12" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm" data-testid="footer-copyright">
            © 2025 Johnson Bros. Plumbing & Drain Cleaning / N.J. Services Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showCookieConsent'));
              }}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cookie Preferences
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
