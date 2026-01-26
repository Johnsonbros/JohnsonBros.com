import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";
import { VisibleFAQSection } from "@/components/VisibleFAQSection";
import { LocalReviewsSection } from "@/components/LocalReviewsSection";

export default function HullPlumbing() {
  const pageMetadata = serviceAreaMetadata['hull'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const hullFAQs = [
    {
      question: "Do you provide emergency plumbing services in Hull, MA?",
      answer: "Yes. We offer 24/7 emergency plumbing support throughout Hull."
    },
    {
      question: "Can you handle plumbing for coastal and seasonal properties?",
      answer: "Absolutely. We provide winterization, corrosion prevention, and maintenance for coastal homes."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Hull", url: "https://www.thejohnsonbros.com/service-areas/hull" }
  ];

  const hullServices = [
    { name: "Emergency Plumbing Hull", description: "Rapid response for leaks, flooding, and pipe breaks" },
    { name: "Drain Cleaning Hull", description: "Clear stubborn clogs and restore flow" },
    { name: "Water Heater Service Hull", description: "Repair and installation for hot water reliability" }
  ];

  const localReviews = [
    {
      author: "Peter L. - Nantasket",
      rating: 5,
      datePublished: "2024-11-05",
      reviewBody: "Great service winterizing our summer home in Hull. They understand coastal properties and did a thorough job."
    },
    {
      author: "Carol M. - Pemberton",
      rating: 5,
      datePublished: "2024-10-12",
      reviewBody: "Fixed corroded pipes in our beach house. They used marine-grade materials. Very impressed with their coastal expertise."
    }
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
      </Helmet>

      <LocalBusinessSchema serviceArea="Hull" />
      <ServiceAreaSchema areaName="Hull" services={hullServices} />
      <FAQSchema questions={hullFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />

        <main className="flex-grow">
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    Plumber in Hull, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Trusted plumbing support for Hull's coastal homes and businesses.
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

          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Plumbing Services in Hull
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 response for leaks, burst pipes, and backups", link: "/services/emergency-plumbing" },
                    { title: "Drain Cleaning", desc: "Main line and drain cleaning for coastal properties", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Repair, replace, and maintain water heaters", link: "/services/water-heater" },
                    { title: "Pipe Repair", desc: "Corrosion-resistant pipe repairs", link: "/services/pipe-repair" },
                    { title: "Gas Heat", desc: "Gas line and boiler service", link: "/services/gas-heat" },
                    { title: "General Plumbing", desc: "Fixture installs and plumbing upgrades", link: "/services/general-plumbing" }
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

          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Why Hull Residents Choose Johnson Bros.
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Coastal Response",
                      desc: "Quick scheduling and arrival for Hull emergencies."
                    },
                    {
                      icon: Shield,
                      title: "Coastal Expertise",
                      desc: "Solutions designed for salt air and marine environments."
                    },
                    {
                      icon: CheckCircle,
                      title: "Quality Craftsmanship",
                      desc: "Premium workmanship and materials for long-lasting repairs."
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

          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Hull Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Nantasket",
                    "Allerton",
                    "Windmill Point",
                    "Pemberton",
                    "Point Allerton",
                    "Hull Village"
                  ].map((neighborhood) => (
                    <div key={neighborhood} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-700">{neighborhood}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Common Plumbing Issues in Hull
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Salt Air Corrosion", desc: "Coastal conditions can speed up pipe and fixture wear." },
                    { issue: "Seasonal Winterization", desc: "Vacation homes need shut-down and start-up service." },
                    { issue: "Drain Backups", desc: "Sand and debris can cause frequent clogs." },
                    { issue: "Water Heater Aging", desc: "Heaters exposed to mineral buildup and corrosion." }
                  ].map((issue) => (
                    <div key={issue.issue} className="p-5 bg-white rounded-lg border">
                      <h3 className="text-lg font-semibold mb-2">{issue.issue}</h3>
                      <p className="text-gray-600">{issue.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Local Reviews */}
          <LocalReviewsSection town="Hull" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Hull" faqs={hullFAQs} />

          {/* Nearby Areas */}
          <NearbyServiceAreas currentArea="hull" />

          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Schedule Plumbing Service in Hull</h2>
                <p className="text-gray-600 mb-8">
                  From emergency repairs to seasonal maintenance, we're here for Hull.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call (617) 479-9911
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
