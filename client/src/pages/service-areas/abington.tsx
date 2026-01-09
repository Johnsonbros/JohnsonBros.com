import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";

export default function AbingtonPlumbing() {
  const pageMetadata = serviceAreaMetadata['abington'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const abingtonFAQs = [
    {
      question: "Do you offer emergency plumbing in Abington, MA?",
      answer: "Yes. We provide 24/7 emergency plumbing services in Abington with fast local response times."
    },
    {
      question: "What services do you provide for Abington homeowners?",
      answer: "We handle drain cleaning, water heater repair, pipe replacement, gas heat, and general plumbing repairs."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Abington", url: "https://www.thejohnsonbros.com/service-areas/abington" }
  ];

  const abingtonServices = [
    { name: "Emergency Plumbing Abington", description: "Rapid response for leaks, burst pipes, and urgent repairs" },
    { name: "Drain Cleaning Abington", description: "Clog removal and preventative drain maintenance" },
    { name: "Water Heater Service Abington", description: "Repair and installation for tank and tankless systems" }
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

      <LocalBusinessSchema serviceArea="Abington" />
      <ServiceAreaSchema areaName="Abington" services={abingtonServices} />
      <FAQSchema questions={abingtonFAQs} />
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
                    Plumber in Abington, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Reliable plumbing and drain cleaning for Abington homes and businesses.
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
                  Plumbing Services Available in Abington
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 service for leaks, backups, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning for homes and businesses", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance for all water heaters", link: "/services/water-heater" },
                    { title: "Gas Heat & Boilers", desc: "Licensed gas fitting and heating repairs", link: "/services/gas-heat" },
                    { title: "Pipe Repair", desc: "Leak detection, pipe replacement, and repiping solutions", link: "/services/pipe-repair" },
                    { title: "New Construction", desc: "Rough-in plumbing and finish work for new builds", link: "/services/new-construction" }
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
                  Why Abington Residents Choose Johnson Bros.
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Local Response",
                      desc: "Our team is nearby for same-day service in Abington."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Massachusetts master plumbers with full insurance coverage."
                    },
                    {
                      icon: CheckCircle,
                      title: "Upfront Pricing",
                      desc: "Clear estimates and honest recommendations before any work starts."
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
                  Neighborhoods We Serve in Abington
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Abington Center",
                    "North Abington",
                    "South Abington",
                    "Island Grove",
                    "Montello",
                    "Elm Street"
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
                  Common Plumbing Needs in Abington
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Drain Clogs", desc: "Kitchen and main line clogs caused by older piping." },
                    { issue: "Water Heater Failures", desc: "Aging water heaters needing replacement or repair." },
                    { issue: "Pipe Leaks", desc: "Corrosion or frozen pipes causing leaks in winter." },
                    { issue: "Sump Pump Issues", desc: "Basement pump problems during heavy rains." }
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
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Schedule Plumbing Service in Abington</h2>
                <p className="text-gray-600 mb-8">
                  From emergency repairs to routine maintenance, Johnson Bros. is ready to help.
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
