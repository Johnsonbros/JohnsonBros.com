import Header from "@/components/Header";
import ExpressBooking from "@/components/ExpressBooking";
import ServicesSection from "@/components/ServicesSection";
import TruckSection from "@/components/TruckSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import { SocialProofSection } from "@/components/SocialProofSection";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { useState } from "react";

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
      <div className="min-h-screen bg-gray-50">
        <Header onBookService={() => openBookingModal()} />
        <ExpressBooking onBookService={() => openBookingModal()} />
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
