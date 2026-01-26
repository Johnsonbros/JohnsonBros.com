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

// Nearest office for Pembroke
const PEMBROKE_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.8,
  reviewCount: 47,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours",
  serviceArea: "Pembroke"
};

export default function PembrokePlumbing() {
  const pageMetadata = serviceAreaMetadata['pembroke'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  // Pembroke-specific FAQs
  const pembrokeFAQs = [
    {
      question: "Do you provide emergency plumbing services in Pembroke, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Pembroke, MA. We can typically arrive within 30-60 minutes for urgent issues."
    },
    {
      question: "What areas of Pembroke do you service?",
      answer: "We service all of Pembroke including Pembroke Center, Bryantville, North Pembroke, West Pembroke, and all surrounding residential areas."
    },
    {
      question: "Do you work on newer subdivision homes?",
      answer: "Absolutely. Many Pembroke homes were built in the 1970s-1990s. We're experts at maintaining modern plumbing systems and addressing issues common to subdivision developments."
    },
    {
      question: "How much do plumbing services cost in Pembroke?",
      answer: "Our service rates start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Can you help with basement flooding issues?",
      answer: "Yes, basement flooding is common in Pembroke due to the water table. We install and repair sump pumps, French drains, and can diagnose foundation water intrusion."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Pembroke", url: "https://www.thejohnsonbros.com/service-areas/pembroke" }
  ];

  const localReviews = [
    {
      author: "Chris W. - Bryantville",
      rating: 5,
      datePublished: "2024-11-22",
      reviewBody: "Fast service and fair pricing. Fixed our basement sump pump before the big storm. Highly recommend for any Pembroke homeowner!"
    },
    {
      author: "Amy B. - North Pembroke",
      rating: 5,
      datePublished: "2024-10-18",
      reviewBody: "Great experience with our water heater replacement. The crew was professional and cleaned up everything. Our new tankless unit is amazing."
    },
    {
      author: "Tom R. - Pembroke Center",
      rating: 5,
      datePublished: "2024-09-25",
      reviewBody: "Called them for a clogged main drain. They had a camera down there within an hour and cleared it same day. Very impressed."
    }
  ];

  const pembrokeServices = [
    { name: "Emergency Plumbing Pembroke", description: "24/7 emergency plumbing repairs for Pembroke homes" },
    { name: "Drain Cleaning Pembroke", description: "Professional drain and sewer cleaning in Pembroke" },
    { name: "Sump Pump Service Pembroke", description: "Sump pump installation and repair" },
    { name: "Pipe Repair Pembroke", description: "Expert pipe repair and replacement" }
  ];

  const neighborhoods = [
    "Pembroke Center",
    "Bryantville",
    "North Pembroke",
    "West Pembroke",
    "Silver Lake",
    "Hobomock",
    "Industrial Park",
    "Country Club",
    "Oldham Pond"
  ];

  const commonIssues = [
    {
      issue: "Subdivision Plumbing Systems",
      desc: "Pembroke's 1970s-1990s subdivisions have modern plumbing that may need updating after 30-40 years of use"
    },
    {
      issue: "Septic System Connections",
      desc: "Many Pembroke properties rely on septic systems requiring proper plumbing connections and maintenance"
    },
    {
      issue: "Basement Flooding",
      desc: "High water tables in many Pembroke neighborhoods cause basement water intrusion requiring sump pump solutions"
    },
    {
      issue: "Water Pressure Issues",
      desc: "Some subdivisions experience pressure fluctuations requiring pressure regulators or booster pumps"
    },
    {
      issue: "PVC Pipe Repairs",
      desc: "Newer homes with PVC plumbing may experience joint failures or freeze damage in unheated areas"
    },
    {
      issue: "Water Heater Replacements",
      desc: "Original water heaters from 1980s-1990s homes are well past their lifespan and need modern replacements"
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
        <meta name="geo.placename" content="Pembroke" />
        <meta name="geo.position" content="42.0637;-70.8009" />
        <meta name="ICBM" content="42.0637, -70.8009" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Pembroke" />
      <ServiceAreaSchema areaName="Pembroke" services={pembrokeServices} />
      <FAQSchema questions={pembrokeFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: PEMBROKE_OFFICE.rating, reviewCount: PEMBROKE_OFFICE.reviewCount }} />

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
                    Plumber in Pembroke, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Pembroke and the South Shore
                </p>

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{PEMBROKE_OFFICE.rating}</span>
                    <span className="text-blue-100">({PEMBROKE_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={PEMBROKE_OFFICE.googleMapsUrl}
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
                  Serving Pembroke from {PEMBROKE_OFFICE.address} | {PEMBROKE_OFFICE.hours}
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
                  Complete Plumbing Services in Pembroke, MA
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Sump Pump Service", desc: "Sump pump installation, repair, and maintenance", link: "/services/general-plumbing" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for heating system installation", link: "/services/gas-heat" },
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
                  Why Pembroke Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response",
                      desc: "Same-day service for Pembroke residents. Emergency help available 24/7."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Subdivision Experts",
                      desc: "Extensive experience with Pembroke's subdivision homes, septic systems, and sump pumps."
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
                  Pembroke Neighborhoods We Serve
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
                  Common Plumbing Issues in Pembroke Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Pembroke's 1970s-1990s subdivision homes have specific plumbing needs. We're experts at:
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
          <LocalReviewsSection town="Pembroke" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Pembroke" faqs={pembrokeFAQs} />

          {/* Nearby Service Areas */}
          <NearbyServiceAreas currentArea="pembroke" />

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Schedule Plumbing Service in Pembroke
                </h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to sump pump maintenance, Johnson Bros. is ready to help Pembroke residents.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Serving Pembroke from {PEMBROKE_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {PEMBROKE_OFFICE.phone}
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
