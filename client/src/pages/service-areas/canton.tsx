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

// Nearest office for Canton (served from Quincy HQ)
const CANTON_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.9,
  reviewCount: 68,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Canton"
};

export default function CantonPlumbing() {
  const pageMetadata = serviceAreaMetadata['canton'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Canton-specific FAQs
  const cantonFAQs = [
    {
      question: "Do you provide emergency plumbing services in Canton, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Canton, MA. We can typically arrive within 30-60 minutes for urgent issues like burst pipes, flooding, or major leaks."
    },
    {
      question: "What areas of Canton do you service?",
      answer: "We service all neighborhoods in Canton including Canton Center, Canton Junction, Ponkapoag, Pequitside, Bolivar, and all surrounding residential areas."
    },
    {
      question: "How much do plumbing services cost in Canton?",
      answer: "Our service rates in Canton start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects. We offer transparent, upfront pricing before any work begins."
    },
    {
      question: "Are you licensed to work in Canton, MA?",
      answer: "Yes, we are fully licensed master plumbers in Massachusetts and carry all required permits to work in Canton. We're also fully insured for your protection."
    },
    {
      question: "Do Canton's older homes have common plumbing issues?",
      answer: "Yes, many Canton homes built in the 1950s-1970s have cast iron drain pipes and galvanized supply lines that deteriorate over time. We specialize in replacing these aging systems with modern PVC and copper."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Canton", url: "https://www.thejohnsonbros.com/service-areas/canton" }
  ];

  const localReviews = [
    {
      author: "Robert M. - Canton Center",
      rating: 5,
      datePublished: "2024-12-01",
      reviewBody: "Johnson Bros. replaced our old galvanized pipes in our 1960s Canton home. Professional work and fair pricing. Highly recommend!"
    },
    {
      author: "Lisa H. - Ponkapoag",
      rating: 5,
      datePublished: "2024-11-05",
      reviewBody: "Emergency call on a Saturday for a burst pipe. They arrived within 45 minutes and fixed it quickly. Great service for Canton residents!"
    },
    {
      author: "David K. - Canton Junction",
      rating: 5,
      datePublished: "2024-10-18",
      reviewBody: "They cleared our main sewer line clogged with tree roots. Explained everything and showed us the camera footage. Very thorough."
    }
  ];

  const cantonServices = [
    { name: "Emergency Plumbing Canton", description: "24/7 emergency plumbing repairs for Canton homes and businesses" },
    { name: "Drain Cleaning Canton", description: "Professional drain and sewer cleaning throughout Canton, MA" },
    { name: "Water Heater Service Canton", description: "Water heater repair and installation for Canton residents" },
    { name: "Pipe Repair Canton", description: "Expert pipe repair and replacement for Canton's older infrastructure" }
  ];

  const neighborhoods = [
    "Canton Center",
    "Canton Junction",
    "Ponkapoag",
    "Pequitside",
    "Bolivar",
    "Canton Corner",
    "Blue Hills",
    "Pleasant Street",
    "Neponset Street"
  ];

  const commonIssues = [
    {
      issue: "Cast Iron Drain Deterioration",
      desc: "Many Canton homes built before 1970 have cast iron drain pipes that corrode and crack over time, causing slow drains and backups"
    },
    {
      issue: "Clay Sewer Line Problems",
      desc: "Older Canton properties often have clay sewer lines susceptible to tree root intrusion and collapse"
    },
    {
      issue: "Galvanized Pipe Corrosion",
      desc: "1950s-1970s homes frequently have galvanized supply pipes that rust internally, reducing water pressure and quality"
    },
    {
      issue: "Basement Sump Pump Issues",
      desc: "Canton's hilly terrain and groundwater levels make sump pump maintenance critical for basement flood prevention"
    },
    {
      issue: "Water Heater Failures",
      desc: "Hard water in Canton can reduce water heater lifespan, requiring more frequent maintenance and replacement"
    },
    {
      issue: "Frozen Pipe Prevention",
      desc: "Canton's cold winters require proper pipe insulation, especially in older homes with inadequate wall insulation"
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
        <meta name="geo.placename" content="Canton" />
        <meta name="geo.position" content="42.1584;-71.1448" />
        <meta name="ICBM" content="42.1584, -71.1448" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Canton" />
      <ServiceAreaSchema areaName="Canton" services={cantonServices} />
      <FAQSchema questions={cantonFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: CANTON_OFFICE.rating, reviewCount: CANTON_OFFICE.reviewCount }} />

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
                    Plumber in Canton, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Canton and surrounding areas
                </p>

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{CANTON_OFFICE.rating}</span>
                    <span className="text-blue-100">({CANTON_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={CANTON_OFFICE.googleMapsUrl}
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
                  Serving Canton from {CANTON_OFFICE.address} | {CANTON_OFFICE.hours}
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

          {/* Services in Canton */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Complete Plumbing Services in Canton, MA
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs in Canton", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for Canton homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for furnaces, boilers, and gas lines", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new residential and commercial builds in Canton", link: "/services/new-construction" },
                    { title: "Pipe Repair & Replacement", desc: "Expert pipe repair and re-piping for Canton's aging infrastructure", link: "/services/general-plumbing" }
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
                  Why Canton Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving Canton with same-day service. Our technicians are just 15-20 minutes away from your home or business."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance for your protection."
                    },
                    {
                      icon: CheckCircle,
                      title: "Older Home Expertise",
                      desc: "27+ years experience with Canton's 1950s-1970s housing stock. We know these systems inside and out."
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
                  Canton Neighborhoods We Serve
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
                  Common Plumbing Issues in Canton Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Canton's established neighborhoods from the 1950s-1970s have unique plumbing challenges. We're experts at handling:
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
          <LocalReviewsSection town="Canton" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Canton" faqs={cantonFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="canton" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Canton
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to routine maintenance, Johnson Bros. is ready to help Canton residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Canton from {CANTON_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {CANTON_OFFICE.phone}
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
