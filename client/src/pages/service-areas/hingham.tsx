import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema } from "@/components/schema-markup";

export default function HinghamPlumbing() {
  return (
    <>
      <LocalBusinessSchema serviceArea="Hingham" />
      <Helmet>
        <title>Plumber Hingham MA | Emergency Plumbing Services | Johnson Bros</title>
        <meta 
          name="description" 
          content="Expert plumber in Hingham MA. Emergency plumbing, drain cleaning, water heaters, gas heat, luxury home plumbing. Licensed & insured. Same-day service. Call (617) 479-9911" 
        />
        <meta property="og:title" content="Plumber Hingham MA | Emergency Plumbing | Johnson Bros" />
        <meta property="og:description" content="Professional plumbing services in Hingham MA. 24/7 emergency service. Licensed plumbers serving all Hingham neighborhoods." />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/service-areas/hingham" />
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
                    Plumber in Hingham, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Your trusted local plumbing experts serving Hingham and surrounding areas
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
                  Complete Plumbing Services in Hingham, MA
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for furnaces, boilers, and gas lines", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new residential and commercial builds", link: "/services/new-construction" },
                    { title: "Luxury Home Plumbing", desc: "High-end fixtures and custom plumbing solutions", link: "/services/general-plumbing" }
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
                  Why Hingham Residents Choose Johnson Bros. Plumbing
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving all Hingham neighborhoods with same-day service availability."
                    },
                    {
                      icon: Shield,
                      title: "Premium Service Quality",
                      desc: "White-glove service for Hingham's discerning homeowners with attention to detail."
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
                  Hingham Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Hingham Center",
                    "Hingham Harbor",
                    "Crow Point",
                    "West Hingham",
                    "South Hingham",
                    "Bradley Woods",
                    "Button Island",
                    "Bare Cove"
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
                  Common Plumbing Issues in Hingham Homes
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Historic Home Plumbing", desc: "Expert service for Hingham's beautiful historic homes and colonial properties" },
                    { issue: "Luxury Fixture Installation", desc: "High-end plumbing fixtures and custom bathroom/kitchen installations" },
                    { issue: "Radiant Heat Systems", desc: "Installation and service of radiant floor heating systems" },
                    { issue: "Water Filtration Systems", desc: "Whole-home water filtration and softening systems" },
                    { issue: "Outdoor Plumbing", desc: "Irrigation systems, outdoor kitchens, and pool plumbing" },
                    { issue: "Home Renovation Plumbing", desc: "Complete plumbing for kitchen and bathroom renovations" }
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
                  {["Cohasset", "Hull", "Weymouth", "Quincy", "Scituate", "Norwell", "Rockland", "Hanover"].map((city) => (
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
                Need a Plumber in Hingham Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call Hingham's trusted plumbing experts for fast, reliable service
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
