import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield, Star, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";

// Official Google Business Profile Data
const QUINCY_OFFICE = {
  address: "75 E. Elm Ave, Quincy, MA 02170",
  phone: "(617) 479-9911",
  rating: 4.8,
  reviewCount: 320,
  googleMapsUrl: "https://maps.app.goo.gl/65wd4toecNfd1Qeo7",
  hours: "Open 24 hours"
};

export default function QuincyPlumbing() {
  // Get SEO metadata
  const pageMetadata = serviceAreaMetadata['quincy'];
  const socialTags = generateSocialMetaTags(pageMetadata);
  
  // Local FAQs for Quincy
  const quincyFAQs = [
    {
      question: "Do you provide emergency plumbing services in Quincy, MA?",
      answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Quincy, MA. We can typically arrive within 30-60 minutes for urgent issues like burst pipes, flooding, or major leaks."
    },
    {
      question: "What areas of Quincy do you service?",
      answer: "We service all neighborhoods in Quincy including Wollaston, Marina Bay, Quincy Center, Merrymount, Squantum, Montclair, Germantown, Adams Shore, and West Quincy."
    },
    {
      question: "How much do plumbing services cost in Quincy?",
      answer: "Our service rates in Quincy start at $125 for a diagnostic visit. Drain cleaning starts at $99, and we provide free estimates for larger projects. We offer transparent, upfront pricing before any work begins."
    },
    {
      question: "Are you licensed to work in Quincy, MA?",
      answer: "Yes, we are fully licensed master plumbers in Massachusetts and carry all required permits to work in Quincy. We're also fully insured for your protection."
    }
  ];
  
  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Quincy", url: "https://www.thejohnsonbros.com/service-areas/quincy" }
  ];
  
  const localReviews = [
    {
      author: "Mark T. - Wollaston",
      rating: 5,
      datePublished: "2024-12-01",
      reviewBody: "Johnson Bros. fixed our water heater on a Sunday morning. Great service for Quincy residents!"
    },
    {
      author: "Susan R. - Quincy Center",
      rating: 5,
      datePublished: "2024-11-20",
      reviewBody: "They know the old Quincy homes well. Fixed our galvanized pipe issues perfectly."
    }
  ];
  
  const quincyServices = [
    { name: "Emergency Plumbing Quincy", description: "24/7 emergency plumbing repairs for Quincy homes and businesses" },
    { name: "Drain Cleaning Quincy", description: "Professional drain and sewer cleaning throughout Quincy, MA" },
    { name: "Water Heater Service Quincy", description: "Water heater repair and installation for Quincy residents" },
    { name: "Pipe Repair Quincy", description: "Expert pipe repair and replacement for Quincy's aging infrastructure" }
  ];

  return (
    <>
      <Helmet>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords.join(', ')} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.thejohnsonbros.com${pageMetadata.canonicalUrl}`} />
        
        {/* Open Graph Tags */}
        {Object.entries(socialTags.openGraph).map(([key, value]) => (
          <meta key={key} property={key} content={value} />
        ))}
        
        {/* Twitter Card Tags */}
        {Object.entries(socialTags.twitter).map(([key, value]) => (
          <meta key={key} name={key} content={value} />
        ))}
        
        {/* Local SEO Tags */}
        <meta name="geo.region" content="US-MA" />
        <meta name="geo.placename" content="Quincy" />
        <meta name="geo.position" content="42.2529;-71.0023" />
        <meta name="ICBM" content="42.2529, -71.0023" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      {/* Schema Markup */}
      <LocalBusinessSchema serviceArea="Quincy" />
      <ServiceAreaSchema areaName="Quincy" services={quincyServices} />
      <FAQSchema questions={quincyFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: QUINCY_OFFICE.rating, reviewCount: QUINCY_OFFICE.reviewCount }} />

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
                    Plumber in Quincy, MA
                  </h1>
                </div>
                <p className="text-xl sm:text-2xl mb-4 text-blue-100">
                  Your trusted local plumbing experts serving Quincy and surrounding areas
                </p>

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{QUINCY_OFFICE.rating}</span>
                    <span className="text-blue-100">({QUINCY_OFFICE.reviewCount}+ reviews)</span>
                  </div>
                  <a
                    href={QUINCY_OFFICE.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on Google Maps</span>
                  </a>
                </div>

                {/* Address */}
                <p className="text-blue-100 mb-6">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {QUINCY_OFFICE.address} • {QUINCY_OFFICE.hours}
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

          {/* Services in Quincy */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Complete Plumbing Services in Quincy, MA
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

          {/* Why Choose Us for Quincy */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Why Quincy Residents Choose Johnson Bros. Plumbing
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Response Times",
                      desc: "Serving Quincy with same-day service. Our technicians are just minutes away from your home or business."
                    },
                    {
                      icon: Shield,
                      title: "Licensed & Insured",
                      desc: "Fully licensed Massachusetts master plumbers with comprehensive insurance for your protection."
                    },
                    {
                      icon: CheckCircle,
                      title: "Local Expertise",
                      desc: "25+ years serving Quincy. We know the area's plumbing systems, from historic homes to new construction."
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

          {/* Neighborhoods We Serve */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Quincy Neighborhoods We Serve
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {[
                    "Wollaston",
                    "Marina Bay",
                    "Quincy Center",
                    "Merrymount",
                    "Squantum",
                    "Montclair",
                    "Germantown",
                    "Adams Shore",
                    "West Quincy"
                  ].map((neighborhood) => (
                    <div key={neighborhood} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-700">{neighborhood}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Common Plumbing Issues */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Common Plumbing Issues in Quincy Homes
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  Quincy's mix of historic homes and modern construction creates unique plumbing challenges. We're experts at handling:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { issue: "Old Galvanized Pipe Replacement", desc: "Many Quincy homes built before 1960 have galvanized pipes that need replacement" },
                    { issue: "Sewer Line Issues", desc: "Tree roots and aging infrastructure can cause sewer line problems in established neighborhoods" },
                    { issue: "Water Pressure Problems", desc: "Common in older Quincy homes, we diagnose and fix pressure issues" },
                    { issue: "Frozen Pipes in Winter", desc: "Quincy winters can freeze pipes - we provide emergency thawing and prevention" },
                    { issue: "Basement Flooding", desc: "Many Quincy homes have basement water issues we can resolve" },
                    { issue: "Water Heater Failures", desc: "We replace and upgrade water heaters for Quincy residents" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-johnson-blue">{item.issue}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Nearby Service Areas */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  We Also Serve Nearby Communities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                  {["Braintree", "Weymouth", "Milton", "Boston", "Hingham", "Hull", "Brockton", "Randolph"].map((city) => (
                    <Link key={city} href={`/service-areas/${city.toLowerCase()}`} className="text-johnson-blue hover:text-johnson-teal font-medium">
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Schedule Plumbing Service in Quincy</h2>
                <p className="text-gray-600 mb-4">
                  From emergency repairs to routine maintenance, Johnson Bros. is ready to help.
                </p>
                <p className="text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Visit us at {QUINCY_OFFICE.address}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-johnson-blue text-white" asChild>
                    <a href="tel:6174799911">
                      <Phone className="mr-2 h-5 w-5" /> Call {QUINCY_OFFICE.phone}
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
