import { Clock, Shield, DollarSign, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onBookService: () => void;
}

export default function HeroSection({ onBookService }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Expert Plumbing Services in 
              <span className="text-johnson-orange"> Quincy, MA</span>
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Fast, reliable, and professional plumbing solutions. Licensed, insured, and available 24/7 for emergencies.
            </p>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-johnson-orange" />
                <span className="font-medium">Same Day Service</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-johnson-orange" />
                <span className="font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-johnson-orange" />
                <span className="font-medium">Upfront Pricing</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={onBookService}
                className="bg-johnson-orange text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors transform hover:scale-105 shadow-lg"
                data-testid="hero-book-online-button"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book Online Now
              </Button>
              <a 
                href="tel:6174799911" 
                className="bg-white text-johnson-blue px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors text-center inline-flex items-center justify-center"
                data-testid="hero-call-button"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call (617) 479-9911
              </a>
            </div>
          </div>

          <div className="relative">
            {/* Professional plumber working on modern bathroom fixtures */}
            <img 
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Professional plumber installing modern fixtures" 
              className="rounded-xl shadow-2xl w-full"
            />
            
            {/* Floating Service Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-johnson-blue" data-testid="service-fee">$99</div>
                <div className="text-sm text-gray-600">Service Fee</div>
                <div className="text-xs text-green-600 font-medium">Applied to repair cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
