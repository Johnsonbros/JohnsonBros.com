import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";

export default function HolbrookPlumbing() {
  const pageMetadata = serviceAreaMetadata['holbrook'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const localFAQs = [
    {
      question: "Do you provide emergency plumbing services in Holbrook, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Holbrook, MA. We can typically arrive within 30-60 minutes for urgent issues."
    },
    {
      question: "What areas of Holbrook do you service?",
      answer: "We service all of Holbrook including downtown, residential neighborhoods, and commercial areas near Route 139."
    },
    {
      question: "How much do plumbing services cost in Holbrook?",
      answer: "Our service rates in Holbrook start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects."
    },
    {
      question: "Are you licensed to work in Holbrook, MA?",
      answer: "Yes, we are fully licensed master plumbers in Massachusetts and carry all required permits to work in Holbrook."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Holbrook", url: "https://www.thejohnsonbros.com/service-areas/holbrook" }
  ];

  const localReviews = [
    {
      author: "Tom K. - Holbrook",
      rating: 5,
      datePublished: "2024-11-28",
      reviewBody: "Great experience with Johnson Bros! They fixed our kitchen drain quickly. Will use again."
    },
    {
      author: "Linda R. - Holbrook",
      rating: 5,
      datePublished: "2024-10-15",
      reviewBody: "Reliable and professional. They installed our new water heater efficiently."
    }
  ];

  const holbrookServices = [
    { name: "Emergency Plumbing Holbrook", description: "24/7 emergency plumbing repairs for Holbrook homes" },
    { name: "Drain Cleaning Holbrook", description: "Professional drain and sewer cleaning in Holbrook, MA" },
    { name: "Water Heater Service Holbrook", description: "Water heater repair and installation for Holbrook" },
    { name: "Pipe Repair Holbrook", description: "Expert pipe repair and replacement in Holbrook" }
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
        <meta name="geo.placename" content="Holbrook" />
        <meta name="geo.position" content="42.1551;-71.0084" />
        <meta name="ICBM" content="42.1551, -71.0084" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <LocalBusinessSchema serviceArea="Holbrook" />
      <ServiceAreaSchema areaName="Holbrook" services={holbrookServices} />
      <FAQSchema questions={localFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: 4.8, reviewCount: 45 }} />

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
                    Plumber in Holbrook, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Your trusted local plumbing experts serving Holbrook and surrounding communities
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
                  Complete Plumbing Services in Holbrook, MA
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
                  Why Holbrook Residents Choose Johnson Bros. Plumbing
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving Holbrook with same-day service from our nearby location."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with complete insurance."
                    },
                    {
                      icon: CheckCircle,
                      title: "Local Expertise",
                      desc: "We know Holbrook's homes. Expert service for any plumbing challenge."
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

          {/* Nearby Areas */}
          <NearbyServiceAreas currentArea="holbrook" />

          {/* CTA */}
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Need a Plumber in Holbrook Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call Holbrook's trusted plumbing experts for fast, reliable service
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
