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

// Nearest office for East Bridgewater
const EAST_BRIDGEWATER_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.9,
  reviewCount: 31,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "East Bridgewater"
};

export default function EastBridgewaterPlumbing() {
  const pageMetadata = serviceAreaMetadata['east-bridgewater'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // East Bridgewater-specific FAQs
  const eastBridgewaterFAQs = [
    {
      question: "Do you provide emergency plumbing services in East Bridgewater, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout East Bridgewater, MA. We can typically arrive within 45-60 minutes for urgent issues."
    },
    {
      question: "What areas of East Bridgewater do you service?",
      answer: "We service all neighborhoods in East Bridgewater including Central Square, Elmwood, Satucket, Forge Pond, Pleasant Street, and all surrounding residential areas."
    },
    {
      question: "Do you work on well pump systems?",
      answer: "Yes, many East Bridgewater homes have private wells. We install, repair, and maintain well pumps, pressure tanks, and water treatment systems."
    },
    {
      question: "How much do plumbing services cost in East Bridgewater?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you help with septic system issues?",
      answer: "We work alongside septic professionals for complete solutions. We handle all plumbing connections to septic systems and can recommend trusted septic service providers."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "East Bridgewater", url: "https://www.thejohnsonbros.com/service-areas/east-bridgewater" }
  ];

  const localReviews = [
    {
      author: "Mike R. - Central Square",
      rating: 5,
      datePublished: "2024-11-20",
      reviewBody: "Our well pump failed on a Sunday. Johnson Bros. came out and had a new pump installed by Monday afternoon. Saved us from being without water!"
    },
    {
      author: "Sarah L. - Satucket",
      rating: 5,
      datePublished: "2024-10-08",
      reviewBody: "Replaced our old copper pipes in our 1970s home. Very professional crew and they cleaned up after themselves. Highly recommend."
    },
    {
      author: "Brian T. - Elmwood",
      rating: 5,
      datePublished: "2024-09-15",
      reviewBody: "Had them install a new water heater and water softener. Great work and fair pricing for East Bridgewater."
    }
  ];

  const eastBridgewaterServices = [
    { name: "Emergency Plumbing East Bridgewater", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning East Bridgewater", description: "Professional drain and sewer cleaning" },
    { name: "Well Pump Service East Bridgewater", description: "Well pump repair and installation" },
    { name: "Pipe Repair East Bridgewater", description: "Expert pipe repair and replacement" }
  ];

  const neighborhoods = [
    "Central Square",
    "Elmwood",
    "Satucket",
    "Forge Pond",
    "Pleasant Street",
    "Bedford Street",
    "North Street",
    "West Street",
    "Whitman Street"
  ];

  const commonIssues = [
    {
      issue: "Well Pump Systems",
      desc: "Many East Bridgewater homes rely on private wells requiring regular pump maintenance and occasional replacement"
    },
    {
      issue: "Septic System Connections",
      desc: "Proper plumbing connections to septic systems are critical for system health and avoiding backups"
    },
    {
      issue: "Older Copper Line Deterioration",
      desc: "1960s-1980s homes often have aging copper supply lines that develop pinhole leaks over time"
    },
    {
      issue: "Basement Sump Pumps",
      desc: "High water tables in some areas require reliable sump pump systems for basement flood prevention"
    },
    {
      issue: "Water Quality Issues",
      desc: "Well water may need filtration systems for iron removal or water softening"
    },
    {
      issue: "Fixture Updates",
      desc: "Many homes have original 1970s-80s fixtures that need updating for efficiency and reliability"
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
        <meta name="geo.placename" content="East Bridgewater" />
        <meta name="geo.position" content="42.0334;-70.9445" />
        <meta name="ICBM" content="42.0334, -70.9445" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="East Bridgewater" />
      <ServiceAreaSchema areaName="East Bridgewater" services={eastBridgewaterServices} />
      <FAQSchema questions={eastBridgewaterFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: EAST_BRIDGEWATER_OFFICE.rating, reviewCount: EAST_BRIDGEWATER_OFFICE.reviewCount }} />

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
                    Plumber in East Bridgewater, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving East Bridgewater and surrounding areas
                </p>

                {/* Google Rating Badge */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{EAST_BRIDGEWATER_OFFICE.rating}</span>
                    <span className="text-blue-100">({EAST_BRIDGEWATER_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={EAST_BRIDGEWATER_OFFICE.googleMapsUrl}
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
                  Serving East Bridgewater from {EAST_BRIDGEWATER_OFFICE.address} | {EAST_BRIDGEWATER_OFFICE.hours}
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
                  Complete Plumbing Services in East Bridgewater, MA
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Well Pump Service", desc: "Installation, repair, and maintenance of well pump systems", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Water Treatment", desc: "Water softeners, filtration systems, and water quality solutions", link: "/services/general-plumbing" },
                    { title: "Pipe Repair & Replacement", desc: "Expert pipe repair and whole-house re-piping services", link: "/services/general-plumbing" }
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
                  Why East Bridgewater Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Same-day service for East Bridgewater residents. We're ready when you need us."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Well System Experts",
                      desc: "Extensive experience with well pumps, pressure tanks, and water treatment systems."
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
                  East Bridgewater Neighborhoods We Serve
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
                  Common Plumbing Issues in East Bridgewater Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  East Bridgewater's 1960s-1980s housing and rural character create unique plumbing needs. We're experts at handling:
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
          <LocalReviewsSection town="East Bridgewater" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="East Bridgewater" faqs={eastBridgewaterFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="east-bridgewater" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in East Bridgewater
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to well system maintenance, Johnson Bros. is ready to help.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving East Bridgewater from {EAST_BRIDGEWATER_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {EAST_BRIDGEWATER_OFFICE.phone}
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
