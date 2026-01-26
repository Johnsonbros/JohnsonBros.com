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

// Nearest office for Norwell
const NORWELL_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.9,
  reviewCount: 52,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Norwell"
};

export default function NorwellPlumbing() {
  const pageMetadata = serviceAreaMetadata['norwell'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Norwell-specific FAQs
  const norwellFAQs = [
    {
      question: "Do you provide emergency plumbing services in Norwell, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Norwell, MA. We can typically arrive within 30-60 minutes for urgent issues."
    },
    {
      question: "What areas of Norwell do you service?",
      answer: "We service all of Norwell including Norwell Center, Accord, Ridge Hill, Assinippi, Queen Anne's Corner, and all surrounding residential areas."
    },
    {
      question: "Do you service large lot properties with septic systems?",
      answer: "Yes, Norwell's large residential lots often have septic systems. We handle all plumbing connections to septic systems and can coordinate with septic service providers."
    },
    {
      question: "How much do plumbing services cost in Norwell?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you work on well pump systems?",
      answer: "Absolutely. Many Norwell properties have private wells. We install, repair, and maintain well pumps and can recommend water treatment solutions."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Norwell", url: "https://www.thejohnsonbros.com/service-areas/norwell" }
  ];

  const localReviews = [
    {
      author: "Steve H. - Norwell Center",
      rating: 5,
      datePublished: "2024-11-20",
      reviewBody: "Replaced our aging water heater with a high-efficiency model. The crew was professional and explained all our options. Great service!"
    },
    {
      author: "Karen P. - Accord",
      rating: 5,
      datePublished: "2024-10-25",
      reviewBody: "Had them repair our well pump and install a new pressure tank. Water pressure is perfect now. Fair pricing for quality work."
    },
    {
      author: "Michael R. - Ridge Hill",
      rating: 5,
      datePublished: "2024-09-30",
      reviewBody: "Emergency response on a Sunday for a backed-up drain. Fixed quickly and cleaned up perfectly. Highly recommend for Norwell residents."
    }
  ];

  const norwellServices = [
    { name: "Emergency Plumbing Norwell", description: "24/7 emergency plumbing repairs for Norwell homes" },
    { name: "Drain Cleaning Norwell", description: "Professional drain and sewer cleaning in Norwell" },
    { name: "Well Pump Service Norwell", description: "Well pump repair and installation" },
    { name: "Pipe Repair Norwell", description: "Expert pipe repair and replacement" }
  ];

  const neighborhoods = [
    "Norwell Center",
    "Accord",
    "Ridge Hill",
    "Assinippi",
    "Queen Anne's Corner",
    "Church Hill",
    "Jacobs Pond",
    "South Street",
    "Main Street"
  ];

  const commonIssues = [
    {
      issue: "Large Lot Septic Systems",
      desc: "Norwell's generous lot sizes mean many homes rely on septic systems requiring proper plumbing connections and maintenance"
    },
    {
      issue: "Well Pump Systems",
      desc: "Private wells require regular pump inspection, pressure tank maintenance, and occasional system replacement"
    },
    {
      issue: "Older Copper Piping",
      desc: "1960s-1980s homes often have aging copper supply lines that can develop pinhole leaks over time"
    },
    {
      issue: "Water Treatment Needs",
      desc: "Well water may require filtration, softening, or treatment systems for optimal quality"
    },
    {
      issue: "Sump Pump Maintenance",
      desc: "Many Norwell basements need reliable sump pumps to manage groundwater during wet seasons"
    },
    {
      issue: "Fixture Modernization",
      desc: "Updating older fixtures improves water efficiency and prevents leaks in aging systems"
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
        <meta name="geo.placename" content="Norwell" />
        <meta name="geo.position" content="42.1612;-70.8195" />
        <meta name="ICBM" content="42.1612, -70.8195" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Norwell" />
      <ServiceAreaSchema areaName="Norwell" services={norwellServices} />
      <FAQSchema questions={norwellFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: NORWELL_OFFICE.rating, reviewCount: NORWELL_OFFICE.reviewCount }} />

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
                    Plumber in Norwell, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Norwell and the South Shore
                </p>

                {/* Google Rating Badge */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{NORWELL_OFFICE.rating}</span>
                    <span className="text-blue-100">({NORWELL_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={NORWELL_OFFICE.googleMapsUrl}
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
                  Serving Norwell from {NORWELL_OFFICE.address} | {NORWELL_OFFICE.hours}
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
                  Complete Plumbing Services in Norwell, MA
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Well Pump Service", desc: "Well pump installation, repair, and pressure tank service", link: "/services/general-plumbing" },
                    { title: "Water Treatment", desc: "Filtration systems, water softeners, and quality solutions", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
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
                  Why Norwell Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response",
                      desc: "Same-day service for Norwell residents. Emergency help available 24/7."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Well & Septic Experts",
                      desc: "Extensive experience with Norwell's large lot properties, wells, and septic systems."
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
                  Norwell Neighborhoods We Serve
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
                  Common Plumbing Issues in Norwell Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Norwell's 1960s-1980s housing and large residential lots create unique plumbing needs. We're experts at:
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
          <LocalReviewsSection town="Norwell" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Norwell" faqs={norwellFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="norwell" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Norwell
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to well system maintenance, Johnson Bros. is ready to help Norwell residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Norwell from {NORWELL_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {NORWELL_OFFICE.phone}
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
