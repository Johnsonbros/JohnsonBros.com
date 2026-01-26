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

// Nearest office for Duxbury (served from Quincy HQ)
const DUXBURY_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.9,
  reviewCount: 48,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Duxbury"
};

export default function DuxburyPlumbing() {
  const pageMetadata = serviceAreaMetadata['duxbury'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Duxbury-specific FAQs
  const duxburyFAQs = [
    {
      question: "Do you provide emergency plumbing services in Duxbury, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Duxbury, MA. We can typically arrive within 45-60 minutes for urgent issues like burst pipes, flooding, or major leaks."
    },
    {
      question: "What areas of Duxbury do you service?",
      answer: "We service all neighborhoods in Duxbury including Duxbury Beach, Snug Harbor, Island Creek, Millbrook, High Street, Powder Point, and all surrounding coastal and inland areas."
    },
    {
      question: "Do you have experience with coastal home plumbing?",
      answer: "Absolutely. Duxbury's coastal location requires special expertise. We're experienced with salt air corrosion, coastal well systems, outdoor shower plumbing, and the unique challenges of beachfront properties."
    },
    {
      question: "How much do plumbing services cost in Duxbury?",
      answer: "Our service rates in Duxbury start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects like pipe replacement."
    },
    {
      question: "Can you work on well and septic systems?",
      answer: "Yes, many Duxbury homes have private wells and septic systems. We handle well pump repairs, water treatment, and all plumbing connections to septic systems."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Duxbury", url: "https://www.thejohnsonbros.com/service-areas/duxbury" }
  ];

  const localReviews = [
    {
      author: "Jennifer S. - Duxbury Beach",
      rating: 5,
      datePublished: "2024-11-28",
      reviewBody: "They understand coastal home challenges. Fixed our corroded outdoor shower plumbing and recommended salt-resistant fixtures. Excellent work!"
    },
    {
      author: "Tom B. - Snug Harbor",
      rating: 5,
      datePublished: "2024-10-15",
      reviewBody: "Our well pump failed and they came out the same day. Professional service and they explained everything about our coastal well system."
    },
    {
      author: "Karen M. - Island Creek",
      rating: 5,
      datePublished: "2024-09-22",
      reviewBody: "Had a septic backup issue and they handled it quickly and professionally. Very knowledgeable about Duxbury's unique plumbing needs."
    }
  ];

  const duxburyServices = [
    { name: "Emergency Plumbing Duxbury", description: "24/7 emergency plumbing repairs for Duxbury homes" },
    { name: "Drain Cleaning Duxbury", description: "Professional drain and sewer cleaning throughout Duxbury" },
    { name: "Water Heater Service Duxbury", description: "Water heater repair and installation for Duxbury residents" },
    { name: "Coastal Plumbing Duxbury", description: "Specialized plumbing for Duxbury's coastal properties" }
  ];

  const neighborhoods = [
    "Duxbury Beach",
    "Snug Harbor",
    "Island Creek",
    "Millbrook",
    "High Street",
    "Powder Point",
    "Bay Road",
    "Washington Street",
    "Standish Shore"
  ];

  const commonIssues = [
    {
      issue: "Salt Air Pipe Corrosion",
      desc: "Coastal properties in Duxbury experience accelerated corrosion on outdoor and exposed plumbing from salt air and spray"
    },
    {
      issue: "Well System Maintenance",
      desc: "Many Duxbury homes rely on private wells that require regular maintenance and occasional pump replacement"
    },
    {
      issue: "Septic System Issues",
      desc: "Duxbury's large lots often have septic systems that need proper plumbing connections and maintenance"
    },
    {
      issue: "Outdoor Shower Plumbing",
      desc: "Beach property outdoor showers require winterization and salt-resistant components"
    },
    {
      issue: "Water Filtration Needs",
      desc: "Well water in Duxbury often contains iron or minerals requiring proper filtration systems"
    },
    {
      issue: "Storm Damage Repairs",
      desc: "Nor'easters and coastal storms can damage exterior plumbing, requiring quick emergency response"
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
        <meta name="geo.placename" content="Duxbury" />
        <meta name="geo.position" content="42.0412;-70.6728" />
        <meta name="ICBM" content="42.0412, -70.6728" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Duxbury" />
      <ServiceAreaSchema areaName="Duxbury" services={duxburyServices} />
      <FAQSchema questions={duxburyFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: DUXBURY_OFFICE.rating, reviewCount: DUXBURY_OFFICE.reviewCount }} />

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
                    Plumber in Duxbury, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Coastal plumbing experts serving Duxbury's waterfront homes and communities
                </p>

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{DUXBURY_OFFICE.rating}</span>
                    <span className="text-blue-100">({DUXBURY_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={DUXBURY_OFFICE.googleMapsUrl}
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
                  Serving Duxbury from {DUXBURY_OFFICE.address} | {DUXBURY_OFFICE.hours}
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

          {/* Services in Duxbury */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Complete Plumbing Services in Duxbury, MA
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs in Duxbury", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for Duxbury homes", link: "/services/drain-cleaning" },
                    { title: "Well Pump Service", desc: "Installation, repair, and maintenance of private well systems", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Coastal Home Plumbing", desc: "Specialized services for Duxbury's waterfront properties", link: "/services/general-plumbing" },
                    { title: "Pipe Repair & Replacement", desc: "Expert pipe repair including salt-resistant materials", link: "/services/general-plumbing" }
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
                  Why Duxbury Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Reliable Response",
                      desc: "Same-day service for Duxbury residents. We understand coastal emergencies can't wait."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance for your protection."
                    },
                    {
                      icon: CheckCircle,
                      title: "Coastal Expertise",
                      desc: "27+ years experience with South Shore coastal homes. We understand salt air, wells, and septic."
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
                  Duxbury Neighborhoods We Serve
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
                  Common Plumbing Issues in Duxbury Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Duxbury's coastal location and many 1970s-era homes create unique plumbing challenges. We're experts at handling:
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
          <LocalReviewsSection town="Duxbury" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Duxbury" faqs={duxburyFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="duxbury" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Duxbury
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to coastal home maintenance, Johnson Bros. is ready to help Duxbury residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Duxbury from {DUXBURY_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {DUXBURY_OFFICE.phone}
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
