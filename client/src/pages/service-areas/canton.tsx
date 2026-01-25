import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";

export default function CantonPlumbing() {
  const pageMetadata = serviceAreaMetadata['canton'];
  const socialTags = generateSocialMetaTags(pageMetadata);

  const localFAQs = [
    { question: "Do you provide emergency plumbing services in Canton, MA?", answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Canton, MA." },
    { question: "What areas of Canton do you service?", answer: "We service all of Canton including Canton Center, Ponkapoag, and all residential areas." },
    { question: "How much do plumbing services cost in Canton?", answer: "Service rates start at $125 for diagnostics. Drain cleaning starts at $99." },
    { question: "Are you licensed to work in Canton?", answer: "Yes, we are fully licensed master plumbers in Massachusetts." }
  ];

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Canton", url: "https://www.thejohnsonbros.com/service-areas/canton" }
  ];

  const localReviews = [
    { author: "Robert M. - Canton", rating: 5, datePublished: "2024-12-01", reviewBody: "Great service! Fixed our kitchen drain same day." },
    { author: "Lisa H. - Canton", rating: 5, datePublished: "2024-11-05", reviewBody: "Professional team that knows Canton homes well." }
  ];

  const services = [
    { name: "Emergency Plumbing Canton", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning Canton", description: "Professional drain and sewer cleaning" },
    { name: "Water Heater Service Canton", description: "Water heater repair and installation" },
    { name: "Pipe Repair Canton", description: "Expert pipe repair and replacement" }
  ];

  return (
    <>
      <Helmet>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords.join(', ')} />
        <link rel="canonical" href={`https://www.thejohnsonbros.com${pageMetadata.canonicalUrl}`} />
        {Object.entries(socialTags.openGraph).map(([key, value]) => (<meta key={key} property={key} content={value} />))}
        {Object.entries(socialTags.twitter).map(([key, value]) => (<meta key={key} name={key} content={value} />))}
        <meta name="geo.region" content="US-MA" />
        <meta name="geo.placename" content="Canton" />
        <meta name="geo.position" content="42.1584;-71.1448" />
        <meta name="ICBM" content="42.1584, -71.1448" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <LocalBusinessSchema serviceArea="Canton" />
      <ServiceAreaSchema areaName="Canton" services={services} />
      <FAQSchema questions={localFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: 4.9, reviewCount: 68 }} />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        <main className="flex-grow">
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">Plumber in Canton, MA</h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">Your trusted local plumbing experts serving Canton and surrounding areas</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6" onClick={() => window.location.href = 'tel:6174799911'}><Phone className="mr-2" /> Call (617) 479-9911</Button>
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-johnson-blue text-lg px-8 py-6" asChild><Link href="/contact">Schedule Service</Link></Button>
                </div>
              </div>
            </div>
          </section>
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Complete Plumbing Services in Canton, MA</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes, leaks, and urgent repairs", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters for furnaces and boilers", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new builds", link: "/services/new-construction" },
                    { title: "Pipe Repair", desc: "Expert pipe repair and re-piping", link: "/services/general-plumbing" }
                  ].map((service, idx) => (
                    <Link key={idx} href={service.link} className="group">
                      <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow h-full">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-johnson-blue">{service.title}</h3>
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
                <h2 className="text-3xl font-bold text-center mb-12">Why Canton Chooses Johnson Bros.</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[{ icon: Clock, title: "Fast Response", desc: "Same-day service available" }, { icon: Shield, title: "Licensed & Insured", desc: "Massachusetts master plumbers" }, { icon: CheckCircle, title: "Local Experts", desc: "We know Canton homes" }].map((f, i) => (
                    <div key={i} className="text-center p-6 bg-white rounded-lg"><f.icon className="h-12 w-12 text-johnson-blue mx-auto mb-4" /><h3 className="text-xl font-semibold mb-3">{f.title}</h3><p className="text-gray-600">{f.desc}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold text-center mb-8">We Also Serve Nearby Communities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                {["Milton", "Randolph", "Stoughton", "Braintree", "Norwood", "Dedham"].map((city) => (
                  <Link key={city} href={`/service-areas/${city.toLowerCase()}`} className="text-johnson-blue hover:text-johnson-teal font-medium">{city}</Link>
                ))}
              </div>
            </div>
          </section>
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Need a Plumber in Canton Today?</h2>
              <p className="text-xl mb-8 text-blue-100">Call Canton's trusted plumbing experts</p>
              <Button size="lg" className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6" onClick={() => window.location.href = 'tel:6174799911'}><Phone className="mr-2" /> Call (617) 479-9911 Now</Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
