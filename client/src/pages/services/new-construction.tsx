import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, Building2, Ruler, ClipboardCheck } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema } from "@/components/schema-markup";

export default function NewConstructionPlumbing() {
  return (
    <>
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham"]}
        service={{
          name: "New Construction Plumbing Services",
          description: "Expert new construction plumbing for residential and commercial projects. Licensed plumbing contractors for new builds across South Shore MA",
          url: "https://johnsonbrosplumbing.com/services/new-construction"
        }}
      />
      <Helmet>
        <title>New Construction Plumbing Services South Shore MA | Commercial & Residential | Johnson Bros</title>
        <meta 
          name="description" 
          content="Expert new construction plumbing for residential and commercial projects in South Shore MA. Licensed plumbing contractors for new builds. Call (617) 479-9911" 
        />
        <meta property="og:title" content="New Construction Plumbing Services | Johnson Bros Plumbing" />
        <meta property="og:description" content="Professional new construction plumbing services across South Shore Massachusetts. Licensed contractors for commercial and residential new builds." />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/new-construction" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  New Construction Plumbing Services in South Shore, MA
                </h1>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Expert plumbing contractors for residential and commercial new construction projects
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
                      Request Quote
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
                  Complete New Construction Plumbing Solutions
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: Building2,
                      title: "Commercial New Construction",
                      items: ["Office buildings", "Retail spaces", "Restaurants", "Multi-family units", "Industrial facilities"]
                    },
                    {
                      icon: Ruler,
                      title: "Residential New Construction",
                      items: ["Single-family homes", "Custom builds", "Townhouses", "Condominiums", "Additions & extensions"]
                    },
                    {
                      icon: ClipboardCheck,
                      title: "Comprehensive Plumbing Systems",
                      items: ["Water supply lines", "Drain, waste, vent systems", "Gas line installation", "Fixture installation", "Code compliance"]
                    },
                    {
                      icon: CheckCircle,
                      title: "Project Management",
                      items: ["Blueprint reading", "Coordination with GCs", "Permit acquisition", "Inspections", "Final walk-throughs"]
                    }
                  ].map((service, idx) => (
                    <div key={idx} className="bg-gray-50 p-8 rounded-lg">
                      <service.icon className="h-12 w-12 text-johnson-blue mb-4" />
                      <h3 className="text-2xl font-semibold mb-4">{service.title}</h3>
                      <ul className="space-y-2">
                        {service.items.map((item, i) => (
                          <li key={i} className="flex items-center text-gray-600">
                            <CheckCircle className="h-5 w-5 text-johnson-blue mr-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Our New Construction Process
                </h2>
                
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { num: "1", title: "Design & Planning", desc: "Blueprint review and system design" },
                    { num: "2", title: "Rough-In", desc: "Install water, drain, and gas lines" },
                    { num: "3", title: "Inspection", desc: "Code compliance verification" },
                    { num: "4", title: "Finish Work", desc: "Fixture installation and testing" }
                  ].map((step, idx) => (
                    <div key={idx} className="text-center">
                      <div className="w-16 h-16 bg-johnson-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                        {step.num}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Why Choose Johnson Bros. for New Construction?
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { title: "Licensed Master Plumbers", desc: "Fully licensed, insured contractors with 25+ years experience in new construction" },
                    { title: "Code Experts", desc: "Deep knowledge of Massachusetts plumbing codes and permit requirements" },
                    { title: "On-Time, On-Budget", desc: "Reliable scheduling and transparent pricing for GCs and builders" },
                    { title: "Quality Materials", desc: "We use only premium materials from trusted manufacturers" },
                    { title: "Warranty Backed", desc: "Comprehensive warranties on all workmanship and materials" },
                    { title: "Proven Track Record", desc: "500+ successful new construction projects completed" }
                  ].map((feature, idx) => (
                    <div key={idx} className="text-center p-6">
                      <CheckCircle className="h-10 w-10 text-johnson-blue mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Serving Builders & Contractors Across South Shore MA
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                  {["Quincy", "Braintree", "Weymouth", "Plymouth", "Marshfield", "Hingham", "Scituate", "Cohasset", "Hanover", "Rockland", "Abington", "Hull"].map((city) => (
                    <Link key={city} href={`/service-areas/${city.toLowerCase()}`} className="text-johnson-blue hover:text-johnson-teal font-medium">
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Start Your New Construction Project with Confidence
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call South Shore's trusted new construction plumbing contractor
              </p>
              <Button 
                size="lg"
                className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => window.location.href = 'tel:6174799911'}
                data-testid="cta-call-button"
              >
                <Phone className="mr-2" /> Call (617) 479-9911 for Quote
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
