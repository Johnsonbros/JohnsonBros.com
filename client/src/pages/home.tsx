import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import TruckSection from "@/components/TruckSection";
import ReviewsSection from "@/components/ReviewsSection";
import ServiceAreaSection from "@/components/ServiceAreaSection";
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
        <HeroSection onBookService={() => openBookingModal()} />
        <ServicesSection onBookService={openBookingModal} />
        <TruckSection />
        <SocialProofSection />
        <ReviewsSection />
        <ServiceAreaSection />
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
