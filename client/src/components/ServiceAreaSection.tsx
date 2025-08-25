import { MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const serviceAreas = [
  "Abington",
  "Quincy",
  "Braintree", 
  "Milton",
  "Weymouth",
  "Hingham",
  "Hull"
];

export default function ServiceAreaSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Service Area</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            We proudly serve Abington, Quincy and surrounding communities with reliable plumbing services.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Interactive map placeholder */}
            <div className="bg-gray-100 rounded-xl p-3 sm:p-4 h-80 sm:h-96">
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <div className="text-center px-4">
                  <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-johnson-blue mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-base sm:text-lg font-medium">Interactive Service Area Map</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">Abington & Quincy, MA and surrounding areas</p>
                  <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 max-w-xs sm:max-w-sm mx-auto">
                    {serviceAreas.map((area) => (
                      <div 
                        key={area}
                        className="bg-white/80 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium text-gray-700"
                        data-testid={`service-area-${area.toLowerCase()}`}
                      >
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Areas We Serve</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {serviceAreas.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-johnson-blue flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base" data-testid={`area-list-${area.toLowerCase()}`}>
                    {area}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-johnson-blue text-white p-4 sm:p-6 rounded-xl">
              <h4 className="text-lg sm:text-xl font-bold mb-2">24/7 Emergency Service</h4>
              <p className="mb-4 text-sm sm:text-base">
                Plumbing emergencies don't wait for business hours. We're available around the clock for urgent repairs.
              </p>
              <Button
                asChild
                className="bg-white text-johnson-blue hover:bg-gray-100 w-full sm:w-auto touch-target"
                data-testid="emergency-service-call-button"
              >
                <a href="tel:6174799911" className="inline-flex items-center justify-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Call Now: (617) 479-9911</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
