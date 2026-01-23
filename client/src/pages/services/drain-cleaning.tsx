import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, Droplets, Zap, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { serviceMetadata, serviceFAQs, generateSocialMetaTags } from "@/lib/seoMetadata";
import dirtySinkImg from '@assets/dirty-sink.jpg';
import slowDrainImg from '@assets/slow-drain.png';

export default function DrainCleaningServices() {
  // Get SEO metadata
  const pageMetadata = serviceMetadata['drain-cleaning'];
  const socialTags = generateSocialMetaTags(pageMetadata);
  const pageFAQs = [...serviceFAQs['drain-cleaning'], ...[
    {
      question: 'What causes drain clogs?',
      answer: 'Common causes include hair buildup, grease, food particles, mineral deposits, tree roots in sewer lines, and foreign objects. Regular maintenance can prevent most clogs.'
    },
    {
      question: 'How often should I have my drains cleaned?',
      answer: 'We recommend professional drain cleaning annually for preventive maintenance, or more frequently for commercial properties or homes with frequent clogs.'
    }
  ]];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Services", url: "https://www.thejohnsonbros.com/services" },
    { name: "Drain Cleaning", url: "https://www.thejohnsonbros.com/services/drain-cleaning" }
  ];

  const reviews = [
    {
      author: "Tom R.",
      rating: 5,
      datePublished: "2024-11-28",
      reviewBody: "Johnson Bros. cleared our main sewer line quickly and efficiently. Their hydro-jetting service worked perfectly. Excellent service!"
    },
    {
      author: "Jennifer S.",
      rating: 5,
      datePublished: "2024-11-15",
      reviewBody: "Had a stubborn kitchen drain clog. They arrived same day and fixed it in under an hour. Fair pricing and professional service."
    }
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
        
        {/* Additional SEO Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Johnson Bros. Plumbing & Drain Cleaning" />
      </Helmet>
      
      {/* Schema Markup */}
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham"]}
        service={{
          name: "Drain Cleaning Services",
          description: pageMetadata.description,
          url: `https://www.thejohnsonbros.com${pageMetadata.canonicalUrl}`
        }}
      />
      <FAQSchema questions={pageFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={reviews} aggregateRating={{ ratingValue: 4.9, reviewCount: 156 }} />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        
        <main className="flex-grow" role="main">
          {/* Hero */}
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-12 sm:py-16 lg:py-20" aria-label="Drain Cleaning Hero">
            <div className="container mx-auto px-4">
              <header className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                  Drain Cleaning Services in South Shore, MA
                </h1>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">
                  Fast, effective solutions for clogged drains, sewer lines, and slow-flowing pipes
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button 
                    size="lg"
                    className="bg-white text-johnson-blue hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 min-h-[56px] touch-manipulation"
                    onClick={() => window.location.href = 'tel:6174799911'}
                    data-testid="call-button"
                  >
                    <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Call (617) 479-9911
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-johnson-blue text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 min-h-[56px] touch-manipulation"
                    asChild
                  >
                    <Link href="/contact" data-testid="contact-button">
                      Schedule Cleaning
                    </Link>
                  </Button>
                </div>
              </header>
            </div>
          </section>

          {/* Common Drain Problems */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Common Drain Problems We Solve
                </h2>
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={dirtySinkImg} 
                      alt="Clogged sink drain with standing water" 
                      className="w-full h-64 object-cover"
                      data-testid="img-clogged-sink"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white font-semibold">Clogged Drains - Fast Professional Cleaning</p>
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={slowDrainImg} 
                      alt="Slow draining sink requiring professional cleaning" 
                      className="w-full h-64 object-cover"
                      data-testid="img-slow-drain"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white font-semibold">Slow Draining? We Can Help!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="py-16 bg-white" aria-label="Our Drain Cleaning Services" id="services">
            <div className="container mx-auto px-4">
              <article className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Professional Drain Cleaning Services
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { icon: Droplets, title: "Kitchen Drain Cleaning", desc: "Clear grease, food particles, and buildup from kitchen sinks and disposals" },
                    { icon: Droplets, title: "Bathroom Drain Cleaning", desc: "Remove hair, soap scum, and debris from tubs, showers, and bathroom sinks" },
                    { icon: Droplets, title: "Main Sewer Line Cleaning", desc: "Professional hydro-jetting and snaking for main sewer line blockages" },
                    { icon: Droplets, title: "Floor Drain Cleaning", desc: "Clear basement floor drains and prevent water backup" },
                    { icon: Droplets, title: "Toilet Drain Clearing", desc: "Resolve stubborn toilet clogs and drainage issues" },
                    { icon: Droplets, title: "Storm Drain Cleaning", desc: "Clear outdoor drains and prevent flooding around your property" }
                  ].map((service, idx) => (
                    <div key={idx} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                      <service.icon className="h-10 w-10 text-johnson-blue mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.desc}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          {/* Methods */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                  Advanced Drain Cleaning Methods
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      title: "Hydro-Jetting",
                      desc: "High-pressure water jets blast away even the toughest clogs and buildup",
                      features: ["Up to 4000 PSI", "Clears tree roots", "Removes scale buildup", "Long-lasting results"]
                    },
                    {
                      title: "Cable Snaking",
                      desc: "Professional-grade cable machines for standard drain clearing",
                      features: ["Various cable sizes", "Effective on most clogs", "Minimal disruption", "Quick service"]
                    },
                    {
                      title: "Video Camera Inspection",
                      desc: "See exactly what's causing your drain problems",
                      features: ["Pinpoint blockages", "Identify damage", "Prevent future issues", "Detailed reporting"]
                    }
                  ].map((method, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-lg">
                      <Zap className="h-12 w-12 text-johnson-blue mb-4" />
                      <h3 className="text-2xl font-semibold mb-3">{method.title}</h3>
                      <p className="text-gray-600 mb-4">{method.desc}</p>
                      <ul className="space-y-2">
                        {method.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-gray-600">
                            <CheckCircle className="h-5 w-5 text-johnson-blue mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Signs You Need Drain Cleaning */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <ShieldAlert className="h-16 w-16 text-johnson-blue mx-auto mb-4" />
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Signs You Need Professional Drain Cleaning
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    "Slow-draining sinks, tubs, or showers",
                    "Gurgling sounds from drains",
                    "Foul odors coming from drains",
                    "Water backing up in fixtures",
                    "Multiple clogged drains",
                    "Recurring clogs in the same drain",
                    "Toilet water rising when flushed",
                    "Water pooling around floor drains"
                  ].map((sign, idx) => (
                    <div key={idx} className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-johnson-blue mr-3 flex-shrink-0 mt-1" />
                      <p className="text-gray-700">{sign}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-xl text-gray-600 mb-6">
                    Don't wait for a complete backup! Call us at the first sign of trouble.
                  </p>
                  <Button 
                    size="lg"
                    className="bg-johnson-blue text-white hover:bg-johnson-teal text-lg px-8 py-6"
                    onClick={() => window.location.href = 'tel:6174799911'}
                  >
                    <Phone className="mr-2" /> Schedule Drain Cleaning
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
                  Drain Cleaning Services Throughout South Shore MA
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
                Need Drain Cleaning Today?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Fast, effective drain cleaning from South Shore's trusted plumbers
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
          <WhyChooseUs serviceName="drain-cleaning" />
        </main>

        <Footer />
      </div>
    </>
  );
}
