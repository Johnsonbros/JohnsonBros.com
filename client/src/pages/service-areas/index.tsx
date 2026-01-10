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
