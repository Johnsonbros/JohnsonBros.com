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

// Nearest office for Stoughton
const STOUGHTON_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.9,
  reviewCount: 61,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Stoughton"
};

export default function StoughtonPlumbing() {
  const pageMetadata = serviceAreaMetadata['stoughton'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Stoughton-specific FAQs
  const stoughtonFAQs = [
    {
      question: "Do you provide emergency plumbing services in Stoughton, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Stoughton, MA. We can typically arrive within 30-60 minutes for urgent issues."
    },
    {
      question: "What areas of Stoughton do you service?",
      answer: "We service all of Stoughton including Stoughton Center, North Stoughton, the Easton Line area, Porter Street, and all surrounding residential neighborhoods."
    },
    {
      question: "Do you work on older homes with cast iron pipes?",
      answer: "Absolutely. Many Stoughton homes from the 1940s-1960s have cast iron drain stacks. We specialize in repairing and replacing aging cast iron with modern materials."
    },
    {
      question: "How much do plumbing services cost in Stoughton?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you replace lead service lines?",
      answer: "Yes, some older Stoughton homes still have lead service lines from the water main. We can replace these with modern copper or approved materials for safety."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Stoughton", url: "https://www.thejohnsonbros.com/service-areas/stoughton" }
  ];

  const localReviews = [
    {
      author: "Paul R. - North Stoughton",
      rating: 5,
      datePublished: "2024-11-12",
      reviewBody: "Excellent emergency service when our water heater failed. They replaced it the same day with a high-efficiency unit. Very professional crew."
    },
    {
      author: "Nancy K. - Stoughton Center",
      rating: 5,
      datePublished: "2024-10-20",
      reviewBody: "Professional and courteous. Fixed our drain problem quickly. Our 1950s home has cast iron pipes and they knew exactly how to handle them."
    },
    {
      author: "Bob M. - Easton Line",
      rating: 5,
      datePublished: "2024-09-15",
      reviewBody: "Had them replace our old galvanized water lines. House finally has good water pressure. Should have done this years ago!"
    }
  ];

  const stoughtonServices = [
    { name: "Emergency Plumbing Stoughton", description: "24/7 emergency plumbing repairs for Stoughton homes" },
    { name: "Drain Cleaning Stoughton", description: "Professional drain and sewer cleaning in Stoughton" },
    { name: "Cast Iron Repair Stoughton", description: "Cast iron pipe repair and replacement" },
    { name: "Pipe Repair Stoughton", description: "Expert pipe repair and replacement" }
  ];

  const neighborhoods = [
    "Stoughton Center",
    "North Stoughton",
    "Easton Line",
    "Porter Street",
    "Pleasant Street",
    "Park Street",
    "Ames Street",
    "Washington Street",
    "Morton Street"
  ];

  const commonIssues = [
    {
      issue: "Cast Iron Stack Deterioration",
      desc: "Stoughton's 1940s-1960s homes often have cast iron drain stacks that rust and crack after 60+ years of service"
    },
    {
      issue: "Lead Service Line Replacement",
      desc: "Some older properties still have original lead water service lines that should be replaced for health and safety"
    },
    {
      issue: "Galvanized Pipe Corrosion",
      desc: "Post-war homes frequently have galvanized steel supply lines that corrode internally, reducing water pressure"
    },
    {
      issue: "Aging Water Heaters",
      desc: "Many Stoughton homes have water heaters from the 1990s or earlier that are inefficient and at risk of failure"
    },
    {
      issue: "Clay Sewer Line Problems",
      desc: "Older neighborhoods may have original clay sewer laterals prone to root intrusion and joint separation"
    },
    {
      issue: "Boiler System Maintenance",
      desc: "Many older Stoughton homes have hydronic heating systems requiring specialized plumbing knowledge"
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
        <meta name="geo.placename" content="Stoughton" />
        <meta name="geo.position" content="42.1251;-71.1017" />
        <meta name="ICBM" content="42.1251, -71.1017" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Stoughton" />
      <ServiceAreaSchema areaName="Stoughton" services={stoughtonServices} />
      <FAQSchema questions={stoughtonFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: STOUGHTON_OFFICE.rating, reviewCount: STOUGHTON_OFFICE.reviewCount }} />

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
                    Plumber in Stoughton, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Stoughton and surrounding areas
                </p>

                {/* Google Rating Badge */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{STOUGHTON_OFFICE.rating}</span>
                    <span className="text-blue-100">({STOUGHTON_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={STOUGHTON_OFFICE.googleMapsUrl}
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
                  Serving Stoughton from {STOUGHTON_OFFICE.address} | {STOUGHTON_OFFICE.hours}
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
                  Complete Plumbing Services in Stoughton, MA
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Cast Iron Replacement", desc: "Replace aging cast iron stacks with modern PVC systems", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for furnaces and boilers", link: "/services/gas-heat" },
                    { title: "Pipe Repair & Replacement", desc: "Expert pipe repair and whole-house re-piping", link: "/services/general-plumbing" }
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
                  Why Stoughton Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response",
                      desc: "Same-day service for Stoughton residents. Emergency help available 24/7."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Older Home Experts",
                      desc: "Decades of experience with Stoughton's post-war homes, cast iron, and galvanized systems."
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
                  Stoughton Neighborhoods We Serve
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
                  Common Plumbing Issues in Stoughton Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Stoughton's 1940s-1960s housing stock has specific plumbing challenges. We're experts at:
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
          <LocalReviewsSection town="Stoughton" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Stoughton" faqs={stoughtonFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="stoughton" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Stoughton
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to cast iron replacement, Johnson Bros. is ready to help Stoughton residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Stoughton from {STOUGHTON_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {STOUGHTON_OFFICE.phone}
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
