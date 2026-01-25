import Header from "@/components/Header";
import ExpressBooking from "@/components/ExpressBooking";
import { HeroVideoCard } from "@/components/HeroVideoCard";
import ServicesSection from "@/components/ServicesSection";
import TruckSection from "@/components/TruckSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import Footer from "@/components/Footer";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";
import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { businessStructuredData } from "@/lib/structuredData";
import { WhyTrustUs } from "@/components/WhyTrustUs";
import { Helmet } from "react-helmet-async";
import { LocalBusinessSchema, FAQSchema, ReviewSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { commonFAQs, generateSocialMetaTags, staticPageMetadata } from "@/lib/seoMetadata";
import { Shield, Star, Award, ArrowRight, Users, Sparkles, MessageCircle, CalendarCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { InteractiveCoverageMap } from "@/components/InteractiveCoverageMap";

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
          {/* Express Booking Section */}
          <section aria-label="Express Booking">
            <ExpressBooking onBookService={() => openBookingModal()} />
          </section>

          {/* Hero Video Section */}
          <HeroVideoCard />
          
          {/* Services Section */}
          <section aria-label="Our Services" id="services">
            <ServicesSection onBookService={openBookingModal} />
          </section>

          {/* Agentic Experience Section */}
          <section aria-label="Agentic Service Experience" className="bg-slate-50 py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-johnson-blue/10 text-johnson-blue text-sm font-semibold px-4 py-2 rounded-full mb-4">
                  <Sparkles className="h-4 w-4" />
                  Agentic Advantage
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Agentic Service, Human-First Care
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Our AI assistant captures your issue, finds real-time availability, and keeps you updated, while our licensed plumbers
                  deliver the fix across Quincy, Greater Boston, and the South Shore.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-johnson-blue/10 flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-johnson-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Issue Intake</h3>
                  <p className="text-gray-600">
                    Describe the problem once. Our assistant gathers symptoms, photos, and access details so the right tools arrive.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-johnson-orange/10 flex items-center justify-center mb-4">
                    <CalendarCheck className="h-6 w-6 text-johnson-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Scheduling</h3>
                  <p className="text-gray-600">
                    See live appointment windows, book instantly, and get reminders synced to your preferred contact method.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Proactive Updates</h3>
                  <p className="text-gray-600">
                    Get ETA alerts, technician notes, and follow-up care tips so you always know what’s next.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => openBookingModal()}
                >
                  Start Agentic Booking
                </Button>
                <Link href="/ai-booking">
                  <Button size="lg" variant="outline" className="border-johnson-blue text-johnson-blue hover:bg-johnson-blue hover:text-white">
                    See How AI Booking Works
                  </Button>
                </Link>
              </div>
            </div>
          </section>
          
          {/* Consolidated Trust & Reviews Section */}
          <section aria-label="Why Choose Us & Reviews" className="bg-white py-16">
            <div className="container mx-auto px-4">
              {/* Trust Badges */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Why Choose Johnson Bros. Plumbing?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Family-owned, licensed, and on call 24/7 for Quincy, Greater Boston, and the South Shore.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-johnson-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Licensed & Insured</h3>
                  <p className="text-gray-600">
                    MA License #PC1673. Fully insured and bonded for your protection and peace of mind.
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-100 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-johnson-orange rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-white fill-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">4.9/5 Google Rating</h3>
                  <p className="text-gray-600">
                    Hundreds of five-star reviews from Quincy and the South Shore.
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">16+ Years Experience</h3>
                  <p className="text-gray-600">
                    Trusted local plumbers known for courtesy, clean work, and reliable fixes.
                  </p>
                </div>
              </div>

              {/* Google Reviews Embed */}
              <div className="max-w-4xl mx-auto">
                <GoogleReviewsSection />
              </div>
            </div>
          </section>

          {/* The Family Discount Promo */}
          <section aria-label="Family Discount Membership" className="bg-gradient-to-br from-johnson-blue to-blue-800 py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="md:flex items-center">
                    <div className="md:w-1/2 p-8 md:p-12">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-8 w-8 text-johnson-orange" />
                        <span className="text-sm font-semibold text-johnson-orange uppercase tracking-wide">
                          Member Benefits
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Join The Family Discount
                      </h2>
                      <p className="text-lg text-gray-600 mb-6">
                        Get priority scheduling, no service call fees, 10% off all jobs, and exclusive member perks for just $99/year.
                      </p>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">Priority scheduling - get first choice of time slots</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">No $99 service call fees - save on every visit</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">10% discount on all plumbing work</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">Give away 1 referral gift per year</span>
                        </li>
                      </ul>
                      <Link href="/family-discount">
                        <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 group"
                          data-testid="button-family-discount-cta"
                        >
                          Learn More About The Family Discount
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                    <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 text-white">
                      <div className="text-center">
                        <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
                          <div className="text-6xl font-black">$99<span className="text-3xl opacity-90">/year</span></div>
                        </div>
                        <p className="text-lg opacity-90 mb-6">
                          Join hundreds of families saving money on plumbing services
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-sm font-medium">
                            Membership pays for itself after just one service call!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Service Area Map - Desktop Only Widget */}
          <section aria-label="Service Coverage Map" className="hidden lg:block bg-gradient-to-br from-slate-50 to-white py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-johnson-blue/10 text-johnson-blue text-sm font-semibold px-4 py-2 rounded-full mb-4">
                  <MapPin className="h-4 w-4" />
                  Where We Serve
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Local Plumbers, Fast Response
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Serving 14 communities across the South Shore with response times as fast as 15 minutes.
                </p>
              </div>
              <div className="max-w-6xl mx-auto">
                <InteractiveCoverageMap onBookService={() => openBookingModal()} />
              </div>
            </div>
          </section>

          {/* Truck Section */}
          <aside aria-label="Service Fleet">
            <TruckSection />
          </aside>
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
