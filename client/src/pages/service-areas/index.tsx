import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { MapPin, ChevronRight, Phone, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const areas = [
  { name: "Quincy", desc: "Our headquarters, serving all neighborhoods with fast response times." },
  { name: "Braintree", desc: "Expert plumbing services for residential and commercial properties." },
  { name: "Weymouth", desc: "Full-service plumbing and drain cleaning for Weymouth homes." },
  { name: "Plymouth", desc: "Reliable plumbing solutions for the historic Plymouth area." },
  { name: "Marshfield", desc: "Coastal plumbing specialists for Marshfield residents." },
  { name: "Hingham", desc: "Premium plumbing services for Hingham's beautiful homes." },
  { name: "Abington", desc: "Professional plumbing and heating services in Abington." },
  { name: "Rockland", desc: "Trusted local plumbers serving the Rockland community." },
  { name: "Hanover", desc: "Expert drain cleaning and plumbing repairs in Hanover." },
  { name: "Scituate", desc: "Reliable coastal plumbing services for Scituate." },
  { name: "Cohasset", desc: "Premium residential plumbing solutions in Cohasset." },
  { name: "Hull", desc: "Expert plumbing services for Hull's unique coastal needs." }
];

export default function ServiceAreasDirectory() {
  return (
    <>
      <Helmet>
        <title>Service Areas | Johnson Bros. Plumbing & Drain Cleaning South Shore MA</title>
        <meta name="description" content="Johnson Bros. Plumbing serves Quincy, Braintree, Weymouth, Plymouth, Marshfield, Hingham, and the entire South Shore MA. View our full service area directory." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-johnson-blue text-white py-16 sm:py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">Our Service Areas</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Providing expert plumbing and drain cleaning services across South Shore, Massachusetts.
              </p>
            </div>
          </section>

          {/* Directory Grid */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {areas.map((area) => (
                  <Link key={area.name} href={`/service-areas/${area.name.toLowerCase()}`}>
                    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-johnson-blue group h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-johnson-blue transition-colors">
                            <MapPin className="h-6 w-6 text-johnson-blue group-hover:text-white" />
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-johnson-blue group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-2xl font-bold mt-4 mb-2">{area.name}, MA</h3>
                        <p className="text-gray-600 mb-4">{area.desc}</p>
                        <span className="text-johnson-blue font-semibold inline-flex items-center text-sm uppercase tracking-wider">
                          View Local Services
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-white border-t border-gray-100">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6">Don't See Your Town?</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                We're constantly expanding our service area. If you're near the South Shore, give us a call and we'll do our best to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-johnson-blue text-white" asChild>
                  <a href="tel:6174799911">
                    <Phone className="mr-2 h-5 w-5" />
                    Call (617) 479-9911
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Request Information</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
