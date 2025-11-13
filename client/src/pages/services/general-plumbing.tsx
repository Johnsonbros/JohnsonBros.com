import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, Clock, Shield, Star } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema } from "@/components/schema-markup";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import faucetImg from '@assets/plumbing_1763062911390.jpg';

export default function GeneralPlumbing() {
  return (
    <>
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham", "Abington"]}
        service={{
          name: "General Plumbing Services",
          description: "Professional general plumbing services for residential and commercial properties. Complete plumbing repairs, installations, and maintenance across South Shore MA",
          url: "https://johnsonbrosplumbing.com/services/general-plumbing"
        }}
      />
      <Helmet>
        <title>General Plumbing Services South Shore MA | Licensed Plumbers | Johnson Bros</title>
        <meta 
          name="description" 
          content="Professional general plumbing services in South Shore Massachusetts. Licensed plumbers for repairs, installations, maintenance. 24/7 emergency service. Call (617) 479-9911" 
        />
        <meta property="og:title" content="General Plumbing Services South Shore MA | Johnson Bros Plumbing" />
        <meta property="og:description" content="Expert general plumbing services across South Shore MA. Licensed, insured plumbers for all your residential and commercial plumbing needs." />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/general-plumbing" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  General Plumbing Services in South Shore, MA
                </h1>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Professional, licensed plumbers for all your residential and commercial plumbing needs
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
                      Request Service
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Quality Work Showcase */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Quality Plumbing Work You Can Trust
                </h2>
                <div className="mb-12 max-w-3xl mx-auto">
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={faucetImg} 
                      alt="Professional faucet installation showing quality plumbing work" 
                      className="w-full h-80 object-cover"
                      data-testid="img-faucet-installation"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white font-semibold text-lg">Professional Fixture Installation & Plumbing Repairs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services Overview */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Comprehensive General Plumbing Services
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Faucet Repair & Installation", desc: "Fix leaky faucets, install new fixtures, upgrade kitchen and bathroom faucets" },
                    { title: "Toilet Repair & Replacement", desc: "Running toilets, clogs, tank repairs, complete toilet replacement" },
                    { title: "Sink & Disposal Repairs", desc: "Clogged sinks, garbage disposal installation and repair" },
                    { title: "Water Line Services", desc: "Main water line repair, shut-off valve replacement, leak detection" },
                    { title: "Fixture Installation", desc: "Install new plumbing fixtures for kitchens, bathrooms, and laundry rooms" },
                    { title: "Plumbing Maintenance", desc: "Preventive maintenance, annual inspections, system optimization" }
                  ].map((service, idx) => (
                    <div key={idx} className="p-6 border rounded-lg hover:shadow-lg transition-shadow" data-testid={`service-item-${idx}`}>
                      <CheckCircle className="h-8 w-8 text-johnson-blue mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.desc}</p>
                    </div>
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
                  Why Choose Johnson Bros. for General Plumbing?
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { icon: Shield, title: "Licensed & Insured", desc: "Fully licensed Master Plumbers serving South Shore since 2008" },
                    { icon: Clock, title: "24/7 Emergency Service", desc: "Available when you need us most, day or night" },
                    { icon: Star, title: "Highly Rated", desc: "500+ five-star reviews from satisfied customers" },
                    { icon: CheckCircle, title: "Guaranteed Work", desc: "100% satisfaction guarantee on all services" }
                  ].map((feature, idx) => (
                    <div key={idx} className="text-center">
                      <feature.icon className="h-12 w-12 text-johnson-blue mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Serving All of South Shore Massachusetts
                </h2>
                <p className="text-xl text-gray-600 text-center mb-8">
                  We provide general plumbing services throughout the South Shore area, including:
                </p>
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

          {/* FAQ Section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Frequently Asked Questions
                </h2>
                
                <div className="space-y-6">
                  {[
                    {
                      q: "What types of general plumbing services do you offer?",
                      a: "We provide comprehensive plumbing services including faucet repair and installation, toilet repair and replacement, sink and disposal repairs, water line services, fixture installation, drain cleaning, and preventive maintenance for both residential and commercial properties."
                    },
                    {
                      q: "Do you offer emergency plumbing services?",
                      a: "Yes, we provide 24/7 emergency plumbing services throughout the South Shore area. Call (617) 479-9911 anytime for urgent plumbing issues."
                    },
                    {
                      q: "Are your plumbers licensed and insured?",
                      a: "Absolutely. All our plumbers are fully licensed Master Plumbers and our company is fully insured. We've been serving the South Shore since 2008 with professional, reliable service."
                    },
                    {
                      q: "What areas do you serve?",
                      a: "We serve all of South Shore Massachusetts, including Quincy, Braintree, Weymouth, Plymouth, Marshfield, Hingham, and surrounding communities."
                    },
                    {
                      q: "Do you provide free estimates?",
                      a: "Yes, we provide free estimates for most general plumbing services. Contact us at (617) 479-9911 to schedule an appointment."
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-xl font-semibold mb-3">{faq.q}</h3>
                      <p className="text-gray-600">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Need General Plumbing Services Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Call now for fast, professional service from South Shore's trusted plumbers
              </p>
              <Button 
                size="lg"
                className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => window.location.href = 'tel:6174799911'}
                data-testid="cta-call-button"
              >
                <Phone className="mr-2" /> Call (617) 479-9911 Now
              </Button>
            </div>
          </section>
          {/* Why Choose Johnson Bros Section */}
          <WhyChooseUs serviceName="general" />
        </main>

        <Footer />
      </div>
    </>
  );
}
