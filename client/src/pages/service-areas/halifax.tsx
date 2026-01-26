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

// Nearest office for Halifax
const HALIFAX_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.8,
  reviewCount: 28,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Halifax"
};

export default function HalifaxPlumbing() {
  const pageMetadata = serviceAreaMetadata['halifax'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Halifax-specific FAQs
  const halifaxFAQs = [
    {
      question: "Do you provide emergency plumbing services in Halifax, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Halifax, MA. We can typically arrive within 45-60 minutes for urgent issues."
    },
    {
      question: "What areas of Halifax do you service?",
      answer: "We service all of Halifax including Monponsett, Halifax Center, Thompson Street, Pond Street, and all areas near the Monponsett Ponds."
    },
    {
      question: "Do you handle well water issues?",
      answer: "Yes, we're experienced with Halifax's well water challenges including high iron content, hard water, and pump maintenance. We install filtration and treatment systems."
    },
    {
      question: "How much do plumbing services cost in Halifax?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you work on older galvanized pipes?",
      answer: "Yes, many Halifax homes have 1950s-1970s galvanized pipes. We can repair, replace sections, or perform full re-piping with modern materials."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Halifax", url: "https://www.thejohnsonbros.com/service-areas/halifax" }
  ];

  const localReviews = [
    {
      author: "Chris D. - Monponsett",
      rating: 5,
      datePublished: "2024-11-15",
      reviewBody: "Installed a whole-house water filtration system for our well. Water quality is so much better now. Very professional team!"
    },
    {
      author: "Paula M. - Halifax Center",
      rating: 5,
      datePublished: "2024-10-02",
      reviewBody: "They replaced our old galvanized pipes with copper. Our water pressure improved dramatically. Great work at a fair price."
    },
    {
      author: "Steve K. - Thompson Street",
      rating: 5,
      datePublished: "2024-09-10",
      reviewBody: "Quick response for a septic backup issue. They diagnosed the problem and had it fixed the same day. Highly recommend!"
    }
  ];

  const halifaxServices = [
    { name: "Emergency Plumbing Halifax", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning Halifax", description: "Professional drain and sewer cleaning" },
    { name: "Well Water Treatment Halifax", description: "Water filtration and treatment systems" },
    { name: "Pipe Replacement Halifax", description: "Expert pipe repair and replacement" }
  ];

  const neighborhoods = [
    "Monponsett",
    "Halifax Center",
    "Thompson Street",
    "Pond Street",
    "Plymouth Street",
    "Holmes Street",
    "Summit Street",
    "Wood Street",
    "Lake Shore Drive"
  ];

  const commonIssues = [
    {
      issue: "Well Water Iron Content",
      desc: "Halifax well water often has high iron levels causing staining and taste issues requiring proper filtration"
    },
    {
      issue: "Septic System Maintenance",
      desc: "Many Halifax properties use septic systems that need proper plumbing connections and regular maintenance"
    },
    {
      issue: "Galvanized Pipe Corrosion",
      desc: "1950s-1970s homes frequently have galvanized supply pipes that rust internally over time"
    },
    {
      issue: "Well Pump Maintenance",
      desc: "Private wells require regular pump inspection and occasional replacement for reliable water supply"
    },
    {
      issue: "Water Heater Sediment",
      desc: "Well water minerals can cause faster sediment buildup in water heaters requiring more frequent maintenance"
    },
    {
      issue: "Frozen Pipe Prevention",
      desc: "Halifax winters require proper insulation of exposed pipes, especially in crawl spaces and basements"
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
        <meta name="geo.placename" content="Halifax" />
        <meta name="geo.position" content="41.9912;-70.8618" />
        <meta name="ICBM" content="41.9912, -70.8618" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Halifax" />
      <ServiceAreaSchema areaName="Halifax" services={halifaxServices} />
      <FAQSchema questions={halifaxFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: HALIFAX_OFFICE.rating, reviewCount: HALIFAX_OFFICE.reviewCount }} />

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
                    Plumber in Halifax, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Halifax and surrounding areas
                </p>

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{HALIFAX_OFFICE.rating}</span>
                    <span className="text-blue-100">({HALIFAX_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={HALIFAX_OFFICE.googleMapsUrl}
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
                  Serving Halifax from {HALIFAX_OFFICE.address} | {HALIFAX_OFFICE.hours}
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
                  Complete Plumbing Services in Halifax, MA
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes", link: "/services/drain-cleaning" },
                    { title: "Well Pump Service", desc: "Well pump repair, maintenance, and replacement", link: "/services/general-plumbing" },
                    { title: "Water Treatment", desc: "Iron filters, water softeners, and whole-house filtration", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of water heaters", link: "/services/general-plumbing" },
                    { title: "Pipe Replacement", desc: "Galvanized to copper or PEX re-piping services", link: "/services/general-plumbing" }
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
                  Why Halifax Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Reliable Response",
                      desc: "Same-day service for Halifax residents. We're ready when you need us most."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Well Water Experts",
                      desc: "Extensive experience with Halifax's well systems and water quality challenges."
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
                  Halifax Neighborhoods We Serve
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
                  Common Plumbing Issues in Halifax Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Halifax's rural character and 1950s-1970s housing stock create unique plumbing challenges. We're experts at:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
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
          <LocalReviewsSection town="Halifax" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Halifax" faqs={halifaxFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="halifax" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Halifax
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to well system maintenance, Johnson Bros. is ready to help Halifax residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Halifax from {HALIFAX_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {HALIFAX_OFFICE.phone}
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
