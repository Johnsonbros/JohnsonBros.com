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

export default function CohassetPlumbing() {
  const pageMetadata = serviceAreaMetadata['cohasset'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const cohassetFAQs = [
    {
      question: "Do you offer plumbing service for Cohasset homes?",
      answer: "Yes. We provide full-service plumbing for Cohasset including emergency repairs, drain cleaning, and water heater service."
    },
    {
      question: "Can you help with plumbing upgrades or renovations?",
      answer: "Absolutely. We handle fixture upgrades, bathroom remodel plumbing, and whole-home repipes."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Cohasset", url: "https://www.thejohnsonbros.com/service-areas/cohasset" }
  ];

  const cohassetServices = [
    { name: "Emergency Plumbing Cohasset", description: "Rapid response for leaks, flooding, and urgent repairs" },
    { name: "Drain Cleaning Cohasset", description: "Kitchen, bathroom, and main line drain clearing" },
    { name: "Water Heater Service Cohasset", description: "Repair and installation for efficient hot water" }
  ];

  const localReviews = [
    {
      author: "Robert W. - Cohasset Village",
      rating: 5,
      datePublished: "2024-11-08",
      reviewBody: "Excellent work winterizing our coastal home. Very thorough and professional. Highly recommend for Cohasset homeowners."
    },
    {
      author: "Elizabeth P. - Beechwood",
      rating: 5,
      datePublished: "2024-10-15",
      reviewBody: "Replaced corroded pipes in our beach house. They understood the unique challenges of coastal plumbing. Great service!"
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

      <LocalBusinessSchema serviceArea="Cohasset" />
      <ServiceAreaSchema areaName="Cohasset" services={cohassetServices} />
      <FAQSchema questions={cohassetFAQs} />
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
                    Plumber in Cohasset, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Premium plumbing services for Cohasset homes and coastal properties.
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
                  Plumbing Services in Cohasset
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 repairs for leaks, flooding, and backups", link: "/services/emergency-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Repair and replacement for tank and tankless systems", link: "/services/water-heater" },
                    { title: "Pipe Repair", desc: "Leak detection and pipe replacement", link: "/services/pipe-repair" },
                    { title: "Gas Heat", desc: "Boiler, furnace, and gas line service", link: "/services/gas-heat" },
                    { title: "General Plumbing", desc: "Fixture installs, upgrades, and maintenance", link: "/services/general-plumbing" }
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
                  Why Cohasset Residents Choose Johnson Bros.
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Priority Scheduling",
                      desc: "Same-day appointments and emergency support when you need it."
                    },
                    {
                      icon: Shield,
                      title: "Experienced Specialists",
                      desc: "Licensed plumbers who understand coastal home needs."
                    },
                    {
                      icon: CheckCircle,
                      title: "High-End Service",
                      desc: "Premium workmanship and respectful in-home service."
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
                  Cohasset Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Cohasset Village",
                    "Beechwood",
                    "Lighthouse Point",
                    "North Cohasset",
                    "Jerusalem Road",
                    "Border Street"
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
                  Common Plumbing Issues in Cohasset
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { issue: "Corrosion", desc: "Coastal salt air can accelerate pipe corrosion." },
                    { issue: "Sewer Backups", desc: "Older sewer lines that need cleaning or replacement." },
                    { issue: "Water Heater Wear", desc: "Sediment buildup reducing efficiency." },
                    { issue: "Seasonal Shutdowns", desc: "Winterization for seasonal or vacation homes." }
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
          <LocalReviewsSection town="Cohasset" reviews={localReviews} />

          {/* FAQ Section */}
          <VisibleFAQSection town="Cohasset" faqs={cohassetFAQs} />

          {/* Nearby Areas */}
          <NearbyServiceAreas currentArea="cohasset" />

          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Schedule Plumbing Service in Cohasset</h2>
                <p className="text-gray-600 mb-8">
                  Keep your Cohasset home running smoothly with Johnson Bros. Plumbing.
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
