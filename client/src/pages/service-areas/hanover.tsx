import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";

export default function HanoverPlumbing() {
  const pageMetadata = serviceAreaMetadata['hanover'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const hanoverFAQs = [
    {
      question: "Do you provide emergency plumbing in Hanover, MA?",
      answer: "Yes, we are available 24/7 for emergency plumbing repairs in Hanover."
    },
    {
      question: "Can you help with gas heat service in Hanover?",
      answer: "Absolutely. Our licensed gas fitters handle boiler repairs, gas lines, and heating system upgrades."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Hanover", url: "https://www.thejohnsonbros.com/service-areas/hanover" }
  ];

  const hanoverServices = [
    { name: "Emergency Plumbing Hanover", description: "Fast response for urgent plumbing repairs" },
    { name: "Drain Cleaning Hanover", description: "Clog removal and drain maintenance" },
    { name: "Gas Heat Service Hanover", description: "Boiler, furnace, and gas line work" }
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

      <LocalBusinessSchema serviceArea="Hanover" />
      <ServiceAreaSchema areaName="Hanover" services={hanoverServices} />
      <FAQSchema questions={hanoverFAQs} />
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
                    Plumber in Hanover, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Full-service plumbing and heating support for Hanover residents.
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
                  Hanover Plumbing & Heating Services
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 response for leaks, bursts, and backups", link: "/services/emergency-plumbing" },
                    { title: "Drain Cleaning", desc: "Kitchen, bathroom, and main line cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Repair and replacement for all water heater types", link: "/services/water-heater" },
                    { title: "Gas Heat", desc: "Boilers, furnaces, and gas line service", link: "/services/gas-heat" },
                    { title: "Pipe Repair", desc: "Leak detection and pipe replacement", link: "/services/pipe-repair" },
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
                  Why Hanover Homeowners Choose Us
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Prompt Scheduling",
                      desc: "Convenient appointment times and quick emergency response."
                    },
                    {
                      icon: Shield,
                      title: "Trusted Professionals",
                      desc: "Licensed plumbers with deep experience in South Shore systems."
                    },
                    {
                      icon: CheckCircle,
                      title: "Upfront Recommendations",
                      desc: "Clear options and honest guidance before we start work."
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
                  Neighborhoods We Serve in Hanover
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Hanover Center",
                    "North Hanover",
                    "South Hanover",
                    "Assinippi",
                    "Drinkwater",
                    "Rocky Run"
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
                  Common Plumbing Issues in Hanover Homes
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Well & Water Pressure", desc: "Pressure fluctuations and system maintenance for some properties." },
                    { issue: "Sump Pump Failures", desc: "Basement flooding concerns during heavy storms." },
                    { issue: "Drain Backups", desc: "Main line and septic backups needing immediate attention." },
                    { issue: "Aging Water Heaters", desc: "Older tanks needing replacement before failure." }
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
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Need a Hanover Plumber?</h2>
                <p className="text-gray-600 mb-8">
                  Call Johnson Bros. for dependable service throughout Hanover, MA.
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
