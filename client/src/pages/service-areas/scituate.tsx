import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";

export default function ScituatePlumbing() {
  const pageMetadata = serviceAreaMetadata['scituate'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const scituateFAQs = [
    {
      question: "Do you service coastal properties in Scituate?",
      answer: "Yes. We work with coastal homes and address corrosion, salt air exposure, and winterization needs."
    },
    {
      question: "Can you help with emergency plumbing in Scituate?",
      answer: "Absolutely. We offer 24/7 emergency plumbing service throughout Scituate."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Scituate", url: "https://www.thejohnsonbros.com/service-areas/scituate" }
  ];

  const scituateServices = [
    { name: "Emergency Plumbing Scituate", description: "Urgent repairs for leaks, flooding, and burst pipes" },
    { name: "Drain Cleaning Scituate", description: "Clear stubborn clogs and restore proper flow" },
    { name: "Water Heater Service Scituate", description: "Repair and replacement for coastal homes" }
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

      <LocalBusinessSchema serviceArea="Scituate" />
      <ServiceAreaSchema areaName="Scituate" services={scituateServices} />
      <FAQSchema questions={scituateFAQs} />
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
                    Plumber in Scituate, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Coastal plumbing specialists serving Scituate homes year-round.
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
                  Plumbing Services in Scituate
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency repairs for coastal properties", link: "/services/emergency-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Repair, replacement, and maintenance", link: "/services/water-heater" },
                    { title: "Pipe Repair", desc: "Salt air-resistant piping solutions", link: "/services/pipe-repair" },
                    { title: "Gas Heat", desc: "Boiler and gas line service for coastal homes", link: "/services/gas-heat" },
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
                  Why Scituate Residents Choose Johnson Bros.
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Seasonal Readiness",
                      desc: "Winterization and storm preparedness for coastal homes."
                    },
                    {
                      icon: Shield,
                      title: "Trusted Local Team",
                      desc: "Licensed experts with decades of South Shore experience."
                    },
                    {
                      icon: CheckCircle,
                      title: "Quality Materials",
                      desc: "Corrosion-resistant solutions for oceanfront properties."
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
                  Scituate Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Scituate Harbor",
                    "North Scituate",
                    "Minot",
                    "Greenbush",
                    "Humarock",
                    "Egypt"
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
                  Common Plumbing Concerns in Scituate
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Salt Air Corrosion", desc: "Coastal exposure can wear down pipes and fixtures." },
                    { issue: "Storm Surge Backups", desc: "Heavy rains and surge conditions affecting drains." },
                    { issue: "Frozen Pipes", desc: "Wind exposure increases winter freeze risks." },
                    { issue: "Water Heater Wear", desc: "Higher mineral content affecting heater lifespan." }
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

          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Schedule Service in Scituate</h2>
                <p className="text-gray-600 mb-8">
                  Protect your coastal property with trusted plumbing service from Johnson Bros.
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
