import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";
import { VisibleFAQSection } from "@/components/VisibleFAQSection";
import { LocalReviewsSection } from "@/components/LocalReviewsSection";

export default function MiltonPlumbing() {
  const pageMetadata = serviceAreaMetadata['milton'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const localFAQs = [
    {
      question: "Do you provide emergency plumbing services in Milton, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Milton, MA. We can typically arrive within 30-60 minutes for urgent issues like burst pipes, flooding, or major leaks."
    },
    {
      question: "What areas of Milton do you service?",
      answer: "We service all areas of Milton including Milton Village, East Milton, Milton Hill, Cunningham Park, Columbine, and all residential neighborhoods."
    },
    {
      question: "How much do plumbing services cost in Milton?",
      answer: "Our service rates in Milton start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects. We offer transparent, upfront pricing before any work begins."
    },
    {
      question: "Are you licensed to work in Milton, MA?",
      answer: "Yes, we are fully licensed master plumbers in Massachusetts and carry all required permits to work in Milton. We're also fully insured for your protection."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Milton", url: "https://www.thejohnsonbros.com/service-areas/milton" }
  ];

  const localReviews = [
    {
      author: "James P. - Milton Hill",
      rating: 5,
      datePublished: "2024-11-15",
      reviewBody: "Excellent service from Johnson Bros! They fixed our basement sump pump quickly. Highly recommend for Milton residents."
    },
    {
      author: "Carol M. - East Milton",
      rating: 5,
      datePublished: "2024-10-28",
      reviewBody: "Professional and courteous. They knew exactly how to handle our older Milton home's plumbing."
    }
  ];

  const miltonServices = [
    { name: "Emergency Plumbing Milton", description: "24/7 emergency plumbing repairs for Milton homes and businesses" },
    { name: "Drain Cleaning Milton", description: "Professional drain and sewer cleaning throughout Milton, MA" },
    { name: "Water Heater Service Milton", description: "Water heater repair and installation for Milton residents" },
    { name: "Pipe Repair Milton", description: "Expert pipe repair and replacement for Milton properties" }
  ];

  return (
    <>
      <Helmet>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords.join(', ')} />
        <link rel="canonical" href={`https://www.thejohnsonbros.com${pageMetadata.canonicalUrl}`} />
        {Object.entries(socialTags.openGraph).map(([key, value]) => (
          <meta key={key} property={key} content={value} />
        ))}
        {Object.entries(socialTags.twitter).map(([key, value]) => (
          <meta key={key} name={key} content={value} />
        ))}
        <meta name="geo.region" content="US-MA" />
        <meta name="geo.placename" content="Milton" />
        <meta name="geo.position" content="42.2498;-71.0662" />
        <meta name="ICBM" content="42.2498, -71.0662" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <LocalBusinessSchema serviceArea="Milton" />
      <ServiceAreaSchema areaName="Milton" services={miltonServices} />
      <FAQSchema questions={localFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: 4.9, reviewCount: 87 }} />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />

        <main className="flex-grow">
          {/* Hero */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    Plumber in Milton, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Your trusted local plumbing experts serving Milton and surrounding areas
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6"
                    onClick={() => window.location.href = 'tel:6174799911'}
                  >
                    <Phone className="mr-2" /> Call (617) 479-9911
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-johnson-blue text-lg px-8 py-6"
                    asChild
                  >
                    <Link href="/contact">Schedule Service</Link>
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
                  Complete Plumbing Services in Milton, MA
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance of all water heater types", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for furnaces, boilers, and gas lines", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new residential and commercial builds", link: "/services/new-construction" },
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
                  Why Milton Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving Milton with same-day service. Our technicians are just minutes away from your home or business."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance for your protection."
                    },
                    {
                      icon: CheckCircle,
                      title: "Local Expertise",
                      desc: "We know Milton's historic homes and modern construction. Expert service for any plumbing challenge."
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

          {/* Common Issues */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Common Plumbing Issues in Milton Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Milton's historic homes and varied architecture create unique plumbing challenges we handle daily:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Old Pipe Replacement", desc: "Many Milton homes have aging pipes that need upgrading for better water pressure and quality" },
                    { issue: "Sewer Line Problems", desc: "Tree roots and aging infrastructure can cause sewer issues in established neighborhoods" },
                    { issue: "Water Pressure Issues", desc: "Common in older Milton homes, we diagnose and fix pressure problems" },
                    { issue: "Frozen Pipes", desc: "Milton winters can freeze pipes - we provide emergency thawing and prevention" },
                    { issue: "Basement Water Issues", desc: "Many Milton homes experience basement moisture we can address" },
                    { issue: "Water Heater Failures", desc: "We replace and upgrade water heaters for Milton homeowners" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-johnson-blue">{item.issue}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Local Reviews */}
          <LocalReviewsSection town="Milton" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Milton" faqs={localFAQs} />

          {/* Nearby Areas */}
          <NearbyServiceAreas currentArea="milton" className="bg-gray-50" />

          {/* CTA */}
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Need a Plumber in Milton Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call Milton's trusted plumbing experts for fast, reliable service
              </p>
              <Button
                size="lg"
                className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => window.location.href = 'tel:6174799911'}
              >
                <Phone className="mr-2" /> Call (617) 479-9911 Now
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
