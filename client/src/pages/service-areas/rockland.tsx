import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";

export default function RocklandPlumbing() {
  const pageMetadata = serviceAreaMetadata['rockland'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const rocklandFAQs = [
    {
      question: "Are you available for emergency plumbing in Rockland, MA?",
      answer: "Yes. We offer 24/7 emergency plumbing services across Rockland and the South Shore."
    },
    {
      question: "Do you service older homes in Rockland?",
      answer: "Absolutely. We specialize in upgrades and repairs for older plumbing systems, including repipes and drain replacements."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Rockland", url: "https://www.thejohnsonbros.com/service-areas/rockland" }
  ];

  const rocklandServices = [
    { name: "Emergency Plumbing Rockland", description: "Rapid response for leaks, flooding, and broken pipes" },
    { name: "Drain Cleaning Rockland", description: "Hydro-jetting and drain clearing for homes and businesses" },
    { name: "Water Heater Service Rockland", description: "Repair and replacement for tank and tankless units" }
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

      <LocalBusinessSchema serviceArea="Rockland" />
      <ServiceAreaSchema areaName="Rockland" services={rocklandServices} />
      <FAQSchema questions={rocklandFAQs} />
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
                    Plumber in Rockland, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Trusted plumbing and drain cleaning for Rockland families and businesses.
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
                  Plumbing Services in Rockland
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 service for burst pipes and critical repairs", link: "/services/emergency-plumbing" },
                    { title: "Drain Cleaning", desc: "Clog removal and sewer line cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Repair, maintenance, and new installations", link: "/services/water-heater" },
                    { title: "Pipe Repair", desc: "Leak detection and pipe replacement solutions", link: "/services/pipe-repair" },
                    { title: "Gas Heat", desc: "Licensed gas fitting and heating repairs", link: "/services/gas-heat" },
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
                  Why Rockland Homeowners Trust Us
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Same-Day Service",
                      desc: "We prioritize Rockland calls with fast scheduling and quick arrival."
                    },
                    {
                      icon: Shield,
                      title: "Licensed Professionals",
                      desc: "Master plumbers backed by full insurance and warranties."
                    },
                    {
                      icon: CheckCircle,
                      title: "Respectful Service",
                      desc: "Clean work areas, shoe covers, and clear communication."
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
                  Rockland Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "North Rockland",
                    "South Rockland",
                    "French's Stream",
                    "Town Center",
                    "Liberty Street",
                    "Union Street"
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
                  Common Plumbing Issues in Rockland
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Root Intrusions", desc: "Tree roots causing blockages in older sewer lines." },
                    { issue: "Low Water Pressure", desc: "Mineral buildup and aging pipes reducing flow." },
                    { issue: "Water Heater Leaks", desc: "Tank corrosion leading to leaks and replacement needs." },
                    { issue: "Frozen Pipes", desc: "Winter freezes causing bursts and emergency calls." }
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

          {/* Nearby Areas */}
          <NearbyServiceAreas currentArea="rockland" />

          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Book a Rockland Plumber Today</h2>
                <p className="text-gray-600 mb-8">
                  Need a reliable plumber in Rockland? Call Johnson Bros. for fast, professional service.
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
