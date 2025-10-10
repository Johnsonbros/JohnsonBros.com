import Header from "@/components/Header";
import ExpressBooking from "@/components/ExpressBooking";
import ServicesSection from "@/components/ServicesSection";
import TruckSection from "@/components/TruckSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import { SocialProofSection } from "@/components/SocialProofSection";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { MCPIntegrationBanner } from "@/components/MCPIntegrationBanner";
import { useState } from "react";
import { SEO } from "@/components/SEO";
import { businessStructuredData } from "@/lib/structuredData";

export default function Home() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const openBookingModal = (serviceId?: string) => {
    setSelectedService(serviceId || null);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedService(null);
  };

  return (
    <>
      <SEO
        title="Johnson Bros. Plumbing & Drain Cleaning | Expert Plumbers in Quincy, MA"
        description="Professional plumbing services in Quincy, MA. Emergency plumbing, drain cleaning, water heater repair, and more. Family-owned since 1997. Call 617-479-9911 for same-day service."
        keywords={["plumber Quincy MA", "emergency plumber", "drain cleaning", "water heater repair", "plumbing services", "Johnson Bros Plumbing"]}
        url="/"
        type="website"
        structuredData={businessStructuredData}
      />
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        <Header onBookService={() => openBookingModal()} />
        <ExpressBooking onBookService={() => openBookingModal()} />
        <div className="container mx-auto px-4">
          <MCPIntegrationBanner variant="compact" />
        </div>
        <ServicesSection onBookService={openBookingModal} />
        <TruckSection />
        <SocialProofSection />
        <GoogleReviewsSection />
        <Footer onBookService={() => openBookingModal()} />
      </div>
      
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        preSelectedService={selectedService}
      />
    </>
  );
}
