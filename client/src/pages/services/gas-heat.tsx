import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, Flame, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema } from "@/components/schema-markup";

export default function GasHeatServices() {
  return (
    <>
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham"]}
        service={{
          name: "Gas Heat Installation & Repair Services",
          description: "Licensed gas fitters providing safe gas heat installation, repair, and maintenance for furnaces, boilers, and water heaters across South Shore MA",
          url: "https://johnsonbrosplumbing.com/services/gas-heat"
        }}
      />
      <Helmet>
        <title>Gas Heat Installation & Repair South Shore MA | Licensed Gas Fitters | Johnson Bros</title>
        <meta 
          name="description" 
          content="Expert gas heat installation and repair in South Shore Massachusetts. Licensed gas fitters for furnaces, boilers, water heaters. 24/7 service. Call (617) 479-9911" 
        />
        <meta property="og:title" content="Gas Heat Services South Shore MA | Johnson Bros Plumbing" />
        <meta property="og:description" content="Professional gas heat installation, repair and maintenance. Licensed gas fitters serving South Shore MA." />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/gas-heat" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Gas Heat Installation & Repair in South Shore, MA
                </h1>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Licensed gas fitters for safe, efficient heating system installation and repair
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
                  Comprehensive Gas Heat Services
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Gas Furnace Services", desc: "Installation, repair, and maintenance of gas furnaces and heating systems" },
                    { title: "Gas Boiler Systems", desc: "Boiler installation, repair, and annual tune-ups for efficient heating" },
                    { title: "Gas Water Heaters", desc: "Tankless and traditional gas water heater installation and service" },
                    { title: "Gas Line Installation", desc: "New gas line installation for heating systems, stoves, and appliances" },
                    { title: "Gas Leak Detection", desc: "Emergency gas leak detection and repair services available 24/7" },
                    { title: "System Conversions", desc: "Convert from oil to gas or upgrade existing gas heating systems" }
                  ].map((service, idx) => (
                    <div key={idx} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                      <Flame className="h-10 w-10 text-johnson-blue mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Safety & Compliance */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <ShieldCheck className="h-16 w-16 text-johnson-blue mx-auto mb-4" />
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Safety First - Always
                  </h2>
                  <p className="text-xl text-gray-600">
                    Our licensed gas fitters prioritize your safety with every installation and repair
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-lg">
                    <h3 className="text-2xl font-semibold mb-4">Licensed & Certified</h3>
                    <ul className="space-y-3">
                      {[
                        "Massachusetts licensed gas fitters",
                        "Up-to-date safety certifications",
                        "Fully insured and bonded",
                        "Ongoing training on latest codes",
                        "Compliance with all local regulations"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-6 w-6 text-johnson-blue mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white p-8 rounded-lg">
                    <h3 className="text-2xl font-semibold mb-4">Safety Protocols</h3>
                    <ul className="space-y-3">
                      {[
                        "Thorough gas leak testing before and after service",
                        "Carbon monoxide detector installation",
                        "Proper ventilation verification",
                        "Pressure testing on all connections",
                        "Complete system safety inspections"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-6 w-6 text-johnson-blue mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Service */}
          <section className="py-16 bg-red-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <Wrench className="h-16 w-16 text-red-600 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  24/7 Emergency Gas Services
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Gas leaks and heating emergencies can't wait. Our licensed gas fitters are available around the clock for emergency service throughout the South Shore.
                </p>
                <Button 
                  size="lg"
                  className="bg-red-600 text-white hover:bg-red-700 text-lg px-8 py-6"
                  onClick={() => window.location.href = 'tel:6174799911'}
                >
                  <Phone className="mr-2" /> Emergency Service: (617) 479-9911
                </Button>
              </div>
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Gas Heat Services Throughout South Shore MA
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                  {["Quincy", "Braintree", "Weymouth", "Plymouth", "Marshfield", "Hingham", "Scituate", "Cohasset", "Hanover", "Rockland", "Abington", "Hull"].map((city) => (
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
                Need Gas Heat Installation or Repair?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Trust South Shore's licensed gas fitters for safe, reliable service
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
