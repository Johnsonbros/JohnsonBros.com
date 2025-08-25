import { MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const serviceAreas = [
  "Quincy",
  "Braintree", 
  "Milton",
  "Weymouth",
  "Hingham",
  "Hull"
];

export default function ServiceAreaSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Service Area</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We proudly serve Quincy and surrounding communities with reliable plumbing services.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Interactive map placeholder */}
            <div className="bg-gray-100 rounded-xl p-4 h-96">
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-johnson-blue mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">Interactive Service Area Map</p>
                  <p className="text-sm text-gray-500 mt-2">Quincy, MA and surrounding areas</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    {serviceAreas.map((area) => (
                      <div 
                        key={area}
                        className="bg-white/80 px-3 py-1 rounded-full text-sm font-medium text-gray-700"
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Areas We Serve</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {serviceAreas.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-johnson-blue" />
                  <span className="font-medium" data-testid={`area-list-${area.toLowerCase()}`}>
                    {area}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-johnson-blue text-white p-6 rounded-xl">
              <h4 className="text-xl font-bold mb-2">24/7 Emergency Service</h4>
              <p className="mb-4">
                Plumbing emergencies don't wait for business hours. We're available around the clock for urgent repairs.
              </p>
              <Button
                asChild
                className="bg-white text-johnson-blue hover:bg-gray-100"
                data-testid="emergency-service-call-button"
              >
                <a href="tel:6174799911" className="inline-flex items-center space-x-2">
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
