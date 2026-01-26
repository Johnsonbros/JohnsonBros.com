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

export default function RandolphPlumbing() {
  const pageMetadata = serviceAreaMetadata['randolph'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const localFAQs = [
    {
      question: "Do you provide emergency plumbing services in Randolph, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Randolph, MA. We can typically arrive within 30-60 minutes for urgent issues like burst pipes, flooding, or major leaks."
    },
    {
      question: "What areas of Randolph do you service?",
      answer: "We service all of Randolph including downtown, North Randolph, South Randolph, and all residential and commercial areas."
    },
    {
      question: "How much do plumbing services cost in Randolph?",
      answer: "Our service rates in Randolph start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects with transparent, upfront pricing."
    },
    {
      question: "Are you licensed to work in Randolph, MA?",
      answer: "Yes, we are fully licensed master plumbers in Massachusetts with all required permits to work in Randolph. We're also fully insured."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Randolph", url: "https://www.thejohnsonbros.com/service-areas/randolph" }
  ];

  const localReviews = [
    {
      author: "David L. - Randolph",
      rating: 5,
      datePublished: "2024-12-05",
      reviewBody: "Johnson Bros saved us when our main drain backed up on Thanksgiving. Fast response and fair pricing!"
    },
    {
      author: "Maria S. - North Randolph",
      rating: 5,
      datePublished: "2024-11-10",
      reviewBody: "Professional team that installed our new water heater. Great service for Randolph homeowners."
    }
  ];

  const randolphServices = [
    { name: "Emergency Plumbing Randolph", description: "24/7 emergency plumbing repairs for Randolph homes and businesses" },
    { name: "Drain Cleaning Randolph", description: "Professional drain and sewer cleaning throughout Randolph, MA" },
    { name: "Water Heater Service Randolph", description: "Water heater repair and installation for Randolph residents" },
    { name: "Pipe Repair Randolph", description: "Expert pipe repair and replacement for Randolph properties" }
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
        <meta name="geo.placename" content="Randolph" />
        <meta name="geo.position" content="42.1626;-71.0415" />
        <meta name="ICBM" content="42.1626, -71.0415" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <LocalBusinessSchema serviceArea="Randolph" />
      <ServiceAreaSchema areaName="Randolph" services={randolphServices} />
      <FAQSchema questions={localFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: 4.9, reviewCount: 74 }} />

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
                    Plumber in Randolph, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Your trusted local plumbing experts serving Randolph and the South Shore
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
                  Complete Plumbing Services in Randolph, MA
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
                  Why Randolph Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving Randolph with same-day service. We're close by and ready to help."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Local Expertise",
                      desc: "We know Randolph's homes and businesses. Expert service for any plumbing need."
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
                  Common Plumbing Issues in Randolph Homes
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Aging Pipe Systems", desc: "Many Randolph homes have pipes that need updating for reliability" },
                    { issue: "Sewer Line Problems", desc: "Tree roots and aging infrastructure cause sewer issues" },
                    { issue: "Water Heater Issues", desc: "We repair and replace water heaters for Randolph homes" },
                    { issue: "Frozen Pipes", desc: "Winter freeze protection and emergency thawing services" },
                    { issue: "Drain Blockages", desc: "Professional drain cleaning for stubborn clogs" },
                    { issue: "Basement Flooding", desc: "Sump pump installation and basement water solutions" }
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
          <LocalReviewsSection town="Randolph" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Randolph" faqs={localFAQs} />

          {/* Nearby Areas */}
          <NearbyServiceAreas currentArea="randolph" className="bg-gray-50" />

          {/* CTA */}
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Need a Plumber in Randolph Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call Randolph's trusted plumbing experts for fast, reliable service
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
