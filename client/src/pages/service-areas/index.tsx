import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { MapPin, ChevronRight, Phone, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveCoverageMap } from "@/components/InteractiveCoverageMap";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";
import { useState } from "react";

const areas = [
  // Core Service Areas (Google Maps locations)
  { name: "Quincy", desc: "Our headquarters, serving all neighborhoods with fast response times.", priority: true },
  { name: "Abington", desc: "Professional plumbing and heating services in Abington.", priority: true },
  // Tier 1 - Adjacent to Quincy/Abington
  { name: "Braintree", desc: "Expert plumbing services for residential and commercial properties." },
  { name: "Weymouth", desc: "Full-service plumbing and drain cleaning for Weymouth homes." },
  { name: "Milton", desc: "Local plumbing experts serving Milton and Milton Village." },
  { name: "Randolph", desc: "Trusted plumbing services for Randolph homeowners." },
  { name: "Holbrook", desc: "Reliable plumbing solutions in Holbrook." },
  // Tier 2 - South Shore Core
  { name: "Rockland", desc: "Trusted local plumbers serving the Rockland community." },
  { name: "Hanover", desc: "Expert drain cleaning and plumbing repairs in Hanover." },
  { name: "Norwell", desc: "Professional plumbing services for Norwell residents." },
  { name: "Hingham", desc: "Premium plumbing services for Hingham's beautiful homes." },
  { name: "Hull", desc: "Expert plumbing services for Hull's unique coastal needs." },
  { name: "Cohasset", desc: "Premium residential plumbing solutions in Cohasset." },
  { name: "Scituate", desc: "Reliable coastal plumbing services for Scituate." },
  { name: "Marshfield", desc: "Coastal plumbing specialists for Marshfield residents." },
  { name: "Whitman", desc: "Expert plumbing services for Whitman homeowners." },
  { name: "Hanson", desc: "Trusted local plumbing services in Hanson." },
  { name: "Pembroke", desc: "Reliable plumbing solutions for Pembroke." },
  { name: "Stoughton", desc: "Professional plumbing and heating in Stoughton." },
  { name: "Canton", desc: "Expert plumbing services for Canton properties." },
  { name: "East Bridgewater", desc: "Quality plumbing services in East Bridgewater.", slug: "east-bridgewater" },
  // Tier 3 - Extended South Shore
  { name: "Duxbury", desc: "Coastal plumbing experts for Duxbury homes." },
  { name: "Kingston", desc: "Trusted plumbing services in Kingston." },
  { name: "Halifax", desc: "Reliable plumbing solutions for Halifax." },
  { name: "Plymouth", desc: "Reliable plumbing solutions for the historic Plymouth area." },
];

export default function ServiceAreasDirectory() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const openBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Service Areas | Johnson Bros. Plumbing & Drain Cleaning South Shore MA</title>
        <meta name="description" content="Johnson Bros. Plumbing serves Quincy, Braintree, Weymouth, Plymouth, Marshfield, Hingham, and the entire South Shore MA. View our full service area directory." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={openBookingModal} />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-johnson-blue text-white py-16 sm:py-20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-pipes-blue" style={{ backgroundBlendMode: 'overlay' }} />
            </div>
            <div className="container mx-auto px-4 text-center relative z-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">Our Service Areas</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Providing expert plumbing and drain cleaning services across the South Shore of Massachusetts. We're your local 24/7 plumbing partners.
              </p>
            </div>
          </section>

          {/* Interactive Coverage Map */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Service Coverage Map</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Click on any marker to see detailed information about our services in that area. Use the "Check My Area" button to verify if we service your location.
                </p>
              </div>
              <InteractiveCoverageMap onBookService={openBookingModal} />
            </div>
          </section>

          {/* Service Areas List */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">South Shore Communities We Serve</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Click on any town to learn more about our plumbing services in that area.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {areas.map((area) => (
                  <Link
                    key={area.name}
                    href={`/service-areas/${(area as any).slug || area.name.toLowerCase().replace(' ', '-')}`}
                    className="group"
                  >
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <MapPin className="h-4 w-4 text-johnson-blue" />
                          <span className="font-semibold group-hover:text-johnson-blue transition-colors">
                            {area.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{area.desc}</p>
                        <ChevronRight className="h-4 w-4 mx-auto mt-2 text-gray-400 group-hover:text-johnson-blue transition-colors" />
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

      <BookingModalEnhanced
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        preSelectedService={null}
      />
    </>
  );
}
