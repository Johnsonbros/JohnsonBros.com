import Header from "@/components/Header";
import ExpressBooking from "@/components/ExpressBooking";
import ServicesSection from "@/components/ServicesSection";
import TruckSection from "@/components/TruckSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import { SocialProofSection } from "@/components/SocialProofSection";
import Footer from "@/components/Footer";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";
import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { businessStructuredData } from "@/lib/structuredData";
import { WhyTrustUs } from "@/components/WhyTrustUs";
import FeaturedProjects from "@/components/FeaturedProjects";
import VideoTestimonials from "@/components/VideoTestimonials";
import { Helmet } from "react-helmet-async";
import { LocalBusinessSchema, FAQSchema, ReviewSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { commonFAQs, generateSocialMetaTags, staticPageMetadata } from "@/lib/seoMetadata";

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

  // Get page metadata
  const pageMetadata = staticPageMetadata['home'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Add preconnect for performance
  useEffect(() => {
    // Add preconnect tags for external resources
    const preconnectLinks = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.googletagmanager.com',
      'https://api.housecallpro.com'
    ];

    preconnectLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      if (href.includes('fonts')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }, []);

  // Sample reviews for schema markup
  const sampleReviews = [
    {
      author: "Sarah M.",
      rating: 5,
      datePublished: "2024-12-15",
      reviewBody: "Johnson Bros. provided excellent emergency service when our pipe burst. They arrived within an hour and fixed everything perfectly. Highly recommend!"
    },
    {
      author: "Mike D.",
      rating: 5,
      datePublished: "2024-12-10",
      reviewBody: "Professional, reliable, and fair pricing. They installed our new water heater and did a fantastic job. Will definitely use them again."
    },
    {
      author: "Lisa K.",
      rating: 5,
      datePublished: "2024-12-05",
      reviewBody: "Best plumbing service in Quincy! They cleared our main sewer line and saved us thousands. Very knowledgeable and honest."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" }
  ];

  return (
    <>
      <Helmet>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords.join(', ')} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.thejohnsonbros.com${pageMetadata.canonicalUrl}`} />
        
        {/* Open Graph Tags */}
        {Object.entries(socialTags.openGraph).map(([key, value]) => (
          <meta key={key} property={key} content={value} />
        ))}
        
        {/* Twitter Card Tags */}
        {Object.entries(socialTags.twitter).map(([key, value]) => (
          <meta key={key} name={key} content={value} />
        ))}
        
        {/* Additional SEO Tags */}
        <meta name="author" content="Johnson Bros. Plumbing & Drain Cleaning" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Local Business Tags */}
        <meta name="geo.region" content="US-MA" />
        <meta name="geo.placename" content="Quincy" />
        <meta name="geo.position" content="42.2529;-71.0023" />
        <meta name="ICBM" content="42.2529, -71.0023" />
      </Helmet>
      
      {/* Schema Markup */}
      <LocalBusinessSchema />
      <FAQSchema questions={commonFAQs} />
      <ReviewSchema reviews={sampleReviews} aggregateRating={{ ratingValue: 4.9, reviewCount: 487 }} />
      <BreadcrumbSchema items={breadcrumbs} />
      
      <SEO
        title={pageMetadata.title}
        description={pageMetadata.description}
        keywords={pageMetadata.keywords}
        url={pageMetadata.canonicalUrl}
        type="website"
        structuredData={businessStructuredData}
      />
      
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        <Header onBookService={() => openBookingModal()} />
        
        <main role="main">
          <section aria-label="Express Booking">
            <ExpressBooking onBookService={() => openBookingModal()} />
          </section>
          
          <section aria-label="Our Services" id="services">
            <ServicesSection onBookService={openBookingModal} />
          </section>
          
          <section aria-label="Why Choose Us">
            <WhyTrustUs />
          </section>
          
          <section aria-label="Featured Projects">
            <FeaturedProjects />
          </section>
          
          <section aria-label="Customer Testimonials">
            <VideoTestimonials />
          </section>
          
          <aside aria-label="Service Fleet">
            <TruckSection />
          </aside>
          
          <section aria-label="Social Proof">
            <SocialProofSection onBookService={() => openBookingModal()} />
          </section>
          
          <section aria-label="Google Reviews">
            <GoogleReviewsSection />
          </section>
        </main>
        
        <Footer onBookService={() => openBookingModal()} />
      </div>
      
      <BookingModalEnhanced 
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        preSelectedService={selectedService}
      />
    </>
  );
}
