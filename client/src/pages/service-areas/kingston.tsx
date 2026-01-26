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

// Nearest office for Kingston
const KINGSTON_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.8,
  reviewCount: 39,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Kingston"
};

export default function KingstonPlumbing() {
  const pageMetadata = serviceAreaMetadata['kingston'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Kingston-specific FAQs
  const kingstonFAQs = [
    {
      question: "Do you provide emergency plumbing services in Kingston, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Kingston, MA. We can typically arrive within 45-60 minutes for urgent issues."
    },
    {
      question: "What areas of Kingston do you service?",
      answer: "We service all of Kingston including Kingston Center, Rocky Nook, Jones River area, Silver Lake, and all residential neighborhoods."
    },
    {
      question: "Do you work on historic homes?",
      answer: "Yes, Kingston has many older homes with unique plumbing needs. We have extensive experience updating and repairing plumbing in historic properties while preserving their character."
    },
    {
      question: "How much do plumbing services cost in Kingston?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you help with coastal drainage issues?",
      answer: "Absolutely. Kingston's proximity to the coast can create unique drainage challenges. We design and install drainage solutions for coastal properties."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Kingston", url: "https://www.thejohnsonbros.com/service-areas/kingston" }
  ];

  const localReviews = [
    {
      author: "John T. - Kingston Center",
      rating: 5,
      datePublished: "2024-11-19",
      reviewBody: "Great emergency response! Our kitchen pipe burst late at night and they were here within an hour. Fixed it right the first time."
    },
    {
      author: "Mary W. - Rocky Nook",
      rating: 5,
      datePublished: "2024-10-08",
      reviewBody: "Replaced all the old plumbing in our 1920s home. They were careful with the house and did excellent work. Very professional."
    },
    {
      author: "Bob G. - Jones River",
      rating: 5,
      datePublished: "2024-09-15",
      reviewBody: "Installed a new water heater and upgraded our well system. Couldn't be happier with the service and quality."
    }
  ];

  const kingstonServices = [
    { name: "Emergency Plumbing Kingston", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning Kingston", description: "Professional drain and sewer cleaning" },
    { name: "Historic Home Plumbing Kingston", description: "Specialized plumbing for older homes" },
    { name: "Well System Service Kingston", description: "Well pump repair and installation" }
  ];

  const neighborhoods = [
    "Kingston Center",
    "Rocky Nook",
    "Jones River",
    "Silver Lake",
    "Indian Pond",
    "Summer Street",
    "Main Street",
    "Pembroke Street",
    "Green Street"
  ];

  const commonIssues = [
    {
      issue: "Historic Home Plumbing",
      desc: "Kingston's many older homes often have outdated plumbing systems needing careful updates that respect the home's character"
    },
    {
      issue: "Coastal Drainage Issues",
      desc: "Properties near Kingston Bay may experience unique drainage challenges from tidal influence and high water tables"
    },
    {
      issue: "Well System Maintenance",
      desc: "Many Kingston properties rely on private wells requiring regular maintenance and water quality monitoring"
    },
    {
      issue: "Older Municipal Infrastructure",
      desc: "Some downtown Kingston properties connect to aging municipal systems that can affect water pressure and quality"
    },
    {
      issue: "Frozen Pipe Prevention",
      desc: "Older homes may lack adequate insulation, making pipes vulnerable to freezing in Kingston's cold winters"
    },
    {
      issue: "Water Heater Updates",
      desc: "Many Kingston homes have older water heaters that benefit from energy-efficient replacements"
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
        <meta name="geo.placename" content="Kingston" />
        <meta name="geo.position" content="41.9945;-70.7245" />
        <meta name="ICBM" content="41.9945, -70.7245" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Kingston" />
      <ServiceAreaSchema areaName="Kingston" services={kingstonServices} />
      <FAQSchema questions={kingstonFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: KINGSTON_OFFICE.rating, reviewCount: KINGSTON_OFFICE.reviewCount }} />

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
                    Plumber in Kingston, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Kingston and the South Shore
                </p>

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{KINGSTON_OFFICE.rating}</span>
                    <span className="text-blue-100">({KINGSTON_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={KINGSTON_OFFICE.googleMapsUrl}
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
                  Serving Kingston from {KINGSTON_OFFICE.address} | {KINGSTON_OFFICE.hours}
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
                  Complete Plumbing Services in Kingston, MA
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Historic Home Plumbing", desc: "Specialized plumbing updates for Kingston's older homes", link: "/services/general-plumbing" },
                    { title: "Well Pump Service", desc: "Well pump repair, maintenance, and replacement", link: "/services/general-plumbing" },
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
                  Why Kingston Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response",
                      desc: "Same-day service for Kingston residents. Emergency help when you need it most."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Historic Home Experts",
                      desc: "27+ years experience working with Kingston's older homes and unique plumbing systems."
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
                  Kingston Neighborhoods We Serve
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
                  Common Plumbing Issues in Kingston Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Kingston's mix of historic homes and coastal properties creates unique plumbing challenges. We're experts at:
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
          <LocalReviewsSection town="Kingston" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Kingston" faqs={kingstonFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="kingston" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Kingston
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to historic home plumbing, Johnson Bros. is ready to help Kingston residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Kingston from {KINGSTON_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {KINGSTON_OFFICE.phone}
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
