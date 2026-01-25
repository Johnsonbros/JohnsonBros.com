import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema } from "@/components/schema-markup";

export default function MarshfieldPlumbing() {
  return (
    <>
      <LocalBusinessSchema serviceArea="Marshfield" />
      <Helmet>
        <title>Plumber Marshfield MA | Emergency Plumbing Services | Johnson Bros</title>
        <meta 
          name="description" 
          content="Top plumber in Marshfield MA. Emergency plumbing, drain cleaning, water heaters, coastal home plumbing. Licensed & insured. Same-day service. Call (617) 479-9911" 
        />
        <meta property="og:title" content="Plumber Marshfield MA | Emergency Plumbing | Johnson Bros" />
        <meta property="og:description" content="Expert plumbing services in Marshfield MA. 24/7 emergency service. Coastal home plumbing specialists serving all Marshfield neighborhoods." />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/service-areas/marshfield" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        
        <main className="flex-grow">
          {/* Hero */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    Plumber in Marshfield, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Your trusted local plumbing experts serving Marshfield and surrounding areas
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6"
                    onClick={() => window.location.href = 'tel:6174799911'}
                    data-testid="call-button"
                  >
                    <Phone className="mr-2" /> Call (617) 479-9911
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-johnson-blue text-lg px-8 py-6"
                    asChild
                  >
                    <Link href="/contact" data-testid="contact-button">
                      Schedule Service
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Complete Plumbing Services in Marshfield, MA
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for furnaces, boilers, and gas lines", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new residential and commercial builds", link: "/services/new-construction" },
                    { title: "Coastal Home Plumbing", desc: "Specialized service for waterfront and coastal properties", link: "/services/general-plumbing" }
                  ].map((service, idx) => (
                    <Link key={idx} href={service.link} className="group">
                      <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow h-full">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-johnson-blue transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-gray-600">{service.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Why Marshfield Residents Choose Johnson Bros. Plumbing
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving all Marshfield neighborhoods with same-day service availability."
                    },
                    {
                      icon: Shield,
                      title: "Coastal Plumbing Experts",
                      desc: "Specialized knowledge of coastal home plumbing challenges and salt air corrosion prevention."
                    },
                    {
                      icon: CheckCircle,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance protection."
                    }
                  ].map((feature, idx) => (
                    <div key={idx} className="text-center p-6 bg-white rounded-lg">
                      <feature.icon className="h-12 w-12 text-johnson-blue mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Neighborhoods */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Marshfield Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Ocean Bluff",
                    "Brant Rock",
                    "Green Harbor",
                    "Marshfield Hills",
                    "Sea View",
                    "North Marshfield",
                    "Rexhame",
                    "Fieldston"
                  ].map((neighborhood) => (
                    <div key={neighborhood} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-700">{neighborhood}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Common Issues */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Common Plumbing Issues in Marshfield Homes
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Coastal Corrosion Prevention", desc: "Salt air protection for plumbing fixtures and pipes in waterfront homes" },
                    { issue: "Storm Damage Repairs", desc: "Emergency plumbing repairs after nor'easters and coastal storms" },
                    { issue: "Sump Pump Systems", desc: "Installation and maintenance of sump pumps for flood prevention" },
                    { issue: "Well Water Treatment", desc: "Service for homes with private well water systems" },
                    { issue: "Beach House Plumbing", desc: "Seasonal service and winterization for vacation properties" },
                    { issue: "Septic System Integration", desc: "Plumbing service for homes with septic systems" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-johnson-blue">{item.issue}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Nearby Areas */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  We Also Serve Nearby Communities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                  {["Scituate", "Duxbury", "Pembroke", "Hanover", "Norwell", "Plymouth", "Hingham", "Cohasset"].map((city) => (
                    <Link key={city} href={`/service-areas/${city.toLowerCase()}`} className="text-johnson-blue hover:text-johnson-teal font-medium">
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Need a Plumber in Marshfield Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call Marshfield's trusted coastal plumbing experts for fast, reliable service
              </p>
              <Button 
                size="lg"
                className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => window.location.href = 'tel:6174799911'}
                data-testid="cta-call-button"
              >
                <Phone className="mr-2" /> Call (617) 479-9911 Now
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
