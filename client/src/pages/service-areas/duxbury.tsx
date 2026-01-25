import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";

export default function DuxburyPlumbing() {
  const pageMetadata = serviceAreaMetadata['duxbury'];
  const socialTags = generateSocialMetaTags(pageMetadata);
  const localFAQs = [
    { question: "Do you provide emergency plumbing services in Duxbury, MA?", answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Duxbury, MA." },
    { question: "What areas of Duxbury do you service?", answer: "We service all of Duxbury including coastal and inland areas." },
    { question: "How much do plumbing services cost?", answer: "Service rates start at $125 for diagnostics. Drain cleaning starts at $99." },
    { question: "Are you licensed to work in Duxbury?", answer: "Yes, we are fully licensed master plumbers in Massachusetts." }
  ];
  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Duxbury", url: "https://www.thejohnsonbros.com/service-areas/duxbury" }
  ];
  const localReviews = [
    { author: "Richard P. - Duxbury", rating: 5, datePublished: "2024-11-25", reviewBody: "Excellent work on our coastal home's plumbing!" },
    { author: "Sarah M. - Duxbury", rating: 5, datePublished: "2024-10-28", reviewBody: "Professional and knowledgeable team." }
  ];
  const services = [
    { name: "Emergency Plumbing Duxbury", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning Duxbury", description: "Professional drain and sewer cleaning" },
    { name: "Water Heater Service Duxbury", description: "Water heater repair and installation" },
    { name: "Pipe Repair Duxbury", description: "Expert pipe repair and replacement" }
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
        <meta name="geo.placename" content="Duxbury" />
        <meta name="geo.position" content="42.0412;-70.6728" />
        <meta name="ICBM" content="42.0412, -70.6728" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <LocalBusinessSchema serviceArea="Duxbury" />
      <ServiceAreaSchema areaName="Duxbury" services={services} />
      <FAQSchema questions={localFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: 4.9, reviewCount: 48 }} />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        <main className="flex-grow">
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">Plumber in Duxbury, MA</h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">Your trusted local plumbing experts serving Duxbury and the South Shore</p>
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
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Complete Plumbing Services in Duxbury, MA</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes and leaks", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new builds", link: "/services/new-construction" },
                    { title: "Coastal Plumbing", desc: "Specialized service for coastal homes", link: "/services/general-plumbing" }
                  ].map((s, i) => (<Link key={i} href={s.link} className="group"><div className="p-6 border rounded-lg hover:shadow-lg h-full"><h3 className="text-xl font-semibold mb-2 group-hover:text-johnson-blue">{s.title}</h3><p className="text-gray-600">{s.desc}</p></div></Link>))}
                </div>
              </div>
            </div>
          </section>
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold text-center mb-12">Why Duxbury Chooses Johnson Bros.</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[{ icon: Clock, title: "Fast Response", desc: "Same-day service" }, { icon: Shield, title: "Licensed & Insured", desc: "MA master plumbers" }, { icon: CheckCircle, title: "Coastal Expertise", desc: "We know coastal homes" }].map((f, i) => (<div key={i} className="text-center p-6 bg-white rounded-lg"><f.icon className="h-12 w-12 text-johnson-blue mx-auto mb-4" /><h3 className="text-xl font-semibold mb-3">{f.title}</h3><p className="text-gray-600">{f.desc}</p></div>))}
              </div>
            </div>
          </section>
          <NearbyServiceAreas currentArea="duxbury" />
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Need a Plumber in Duxbury Today?</h2>
              <p className="text-xl mb-8 text-blue-100">Call Duxbury's trusted plumbing experts</p>
              <Button size="lg" className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6" onClick={() => window.location.href = 'tel:6174799911'}><Phone className="mr-2" /> Call (617) 479-9911 Now</Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
