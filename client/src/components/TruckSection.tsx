import { CheckCircle, Truck, Shield, Clock } from "lucide-react";

export default function TruckSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Trusted Local Plumbing Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            When you see our truck in your neighborhood, you know professional help has arrived
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Truck Image */}
          <div className="relative">
            <img 
              src="/truck_1756136293648.webp" 
              alt="Johnson Bros. Service Truck" 
              className="w-full h-auto rounded-xl shadow-2xl"
              loading="lazy"
              decoding="async"
              data-testid="service-truck-image"
            />
            <div className="absolute -bottom-6 -right-6 bg-johnson-blue text-white p-4 rounded-lg shadow-lg hidden lg:block">
              <div className="flex items-center space-x-2">
                <Truck className="h-6 w-6" />
                <div>
                  <p className="font-bold text-lg">Fleet Ready</p>
                  <p className="text-sm text-blue-100">Always on the road</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Professional Service You Can Count On
            </h3>
            <p className="text-gray-600 mb-8">
              Our fully-equipped service vehicles carry everything needed to handle most plumbing repairs on the spot. 
              No more waiting for parts or multiple trips - we come prepared to get the job done right the first time.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Fully Stocked</h4>
                  <p className="text-gray-600 text-sm">
                    Our trucks carry a comprehensive inventory of parts and tools
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Licensed & Insured</h4>
                  <p className="text-gray-600 text-sm">
                    Every technician is fully licensed and our work is insured
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">On-Time Service</h4>
                  <p className="text-gray-600 text-sm">
                    We respect your time with prompt arrivals and efficient service
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Serving Massachusetts Since</p>
                  <p className="text-2xl font-bold text-johnson-blue">2015</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Service Calls Completed</p>
                  <p className="text-2xl font-bold text-johnson-blue">5,000+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}