import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield, Star, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";
import { VisibleFAQSection } from "@/components/VisibleFAQSection";
import { LocalReviewsSection } from "@/components/LocalReviewsSection";

// Nearest office for Hanson
const HANSON_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.8,
  reviewCount: 35,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Hanson"
};

export default function HansonPlumbing() {
  const pageMetadata = serviceAreaMetadata['hanson'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Hanson-specific FAQs
  const hansonFAQs = [
    {
      question: "Do you provide emergency plumbing services in Hanson, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Hanson, MA. We can typically arrive within 45-60 minutes for urgent issues."
    },
    {
      question: "What areas of Hanson do you service?",
      answer: "We service all of Hanson including Hanson Center, Indian Head, Maquan, Main Street, and all residential neighborhoods."
    },
    {
      question: "Do you work on well systems?",
      answer: "Yes, many Hanson homes have private wells. We service well pumps, pressure tanks, and can install water treatment systems for well water quality issues."
    },
    {
      question: "How much do plumbing services cost in Hanson?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you help with basement flooding issues?",
      answer: "Absolutely. We install, repair, and maintain sump pump systems to protect Hanson basements from flooding and water damage."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Hanson", url: "https://www.thejohnsonbros.com/service-areas/hanson" }
  ];

  const localReviews = [
    {
      author: "Dan S. - Hanson Center",
      rating: 5,
      datePublished: "2024-11-08",
      reviewBody: "Our sump pump failed during heavy rain. Johnson Bros. came out quickly and installed a new one. Saved our basement from flooding!"
    },
    {
      author: "Susan L. - Indian Head",
      rating: 5,
      datePublished: "2024-10-12",
      reviewBody: "Had them service our well pump and install a water softener. Water is so much better now. Professional and knowledgeable team."
    },
    {
      author: "Kevin M. - Maquan",
      rating: 5,
      datePublished: "2024-09-20",
      reviewBody: "Fixed our kitchen drain clog and inspected our older plumbing. Gave us honest advice on what needed attention. Great service!"
    }
  ];

  const hansonServices = [
    { name: "Emergency Plumbing Hanson", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning Hanson", description: "Professional drain and sewer cleaning" },
    { name: "Well Pump Service Hanson", description: "Well pump repair and installation" },
    { name: "Sump Pump Service Hanson", description: "Sump pump installation and repair" }
  ];

  const neighborhoods = [
    "Hanson Center",
    "Indian Head",
    "Maquan",
    "Main Street",
    "Liberty Street",
    "High Street",
    "Pleasant Street",
    "East Washington Street",
    "Winter Street"
  ];

  const commonIssues = [
    {
      issue: "Private Well Maintenance",
      desc: "Many Hanson homes depend on private wells requiring regular pump service and water quality testing"
    },
    {
      issue: "Basement Sump Pumps",
      desc: "Hanson's terrain and water table make sump pump systems essential for basement flood prevention"
    },
    {
      issue: "Older Fixture Replacement",
      desc: "1960s-1980s homes often have original fixtures that need updating for efficiency and reliability"
    },
    {
      issue: "Septic Connections",
      desc: "Proper plumbing to septic systems requires expertise to avoid backups and system damage"
    },
    {
      issue: "Water Treatment Needs",
      desc: "Well water may require filtration or softening systems for better quality and taste"
    },
    {
      issue: "Frozen Pipe Prevention",
      desc: "Cold Hanson winters demand proper insulation of exposed pipes in crawl spaces and exterior walls"
    }
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

        {/* Local SEO Tags */}
        <meta name="geo.region" content="US-MA" />
        <meta name="geo.placename" content="Hanson" />
        <meta name="geo.position" content="42.0751;-70.8798" />
        <meta name="ICBM" content="42.0751, -70.8798" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Hanson" />
      <ServiceAreaSchema areaName="Hanson" services={hansonServices} />
      <FAQSchema questions={hansonFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: HANSON_OFFICE.rating, reviewCount: HANSON_OFFICE.reviewCount }} />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    Plumber in Hanson, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Hanson and surrounding areas
                </p>

                {/* Google Rating Badge */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{HANSON_OFFICE.rating}</span>
                    <span className="text-blue-100">({HANSON_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={HANSON_OFFICE.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on Google Maps</span>
                  </a>
                </div>

                {/* Service Info */}
                <p className="text-blue-100 mb-6">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Hanson from {HANSON_OFFICE.address} | {HANSON_OFFICE.hours}
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
                  Complete Plumbing Services in Hanson, MA
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes", link: "/services/drain-cleaning" },
                    { title: "Well Pump Service", desc: "Well pump repair, maintenance, and replacement", link: "/services/general-plumbing" },
                    { title: "Sump Pump Systems", desc: "Sump pump installation, repair, and battery backups", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of water heaters", link: "/services/general-plumbing" },
                    { title: "Pipe Repair & Replacement", desc: "Expert pipe repair and re-piping services", link: "/services/general-plumbing" }
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
                  Why Hanson Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response",
                      desc: "Same-day service for Hanson residents. Emergency help when you need it most."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Well & Pump Experts",
                      desc: "Extensive experience with Hanson's well systems and sump pump installations."
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

          {/* Neighborhoods We Serve */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Hanson Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {neighborhoods.map((neighborhood) => (
                    <div key={neighborhood} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-700">{neighborhood}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Common Plumbing Issues */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Common Plumbing Issues in Hanson Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Hanson's 1960s-1980s housing and rural character create unique plumbing challenges. We're experts at:
                </p>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {commonIssues.map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-johnson-blue">{item.issue}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Local Reviews */}
          <LocalReviewsSection town="Hanson" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Hanson" faqs={hansonFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="hanson" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Hanson
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to well pump service, Johnson Bros. is ready to help Hanson residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Hanson from {HANSON_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {HANSON_OFFICE.phone}
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/contact">Request Service</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
