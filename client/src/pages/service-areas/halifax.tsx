import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { LocalBusinessSchema, ServiceAreaSchema, FAQSchema, BreadcrumbSchema, ReviewSchema } from "@/components/schema-markup";
import { serviceAreaMetadata, generateSocialMetaTags } from "@/lib/seoMetadata";
import { NearbyServiceAreas } from "@/components/NearbyServiceAreas";

export default function HalifaxPlumbing() {
  const pageMetadata = serviceAreaMetadata['halifax'];
  const socialTags = generateSocialMetaTags(pageMetadata);
  const localFAQs = [
    { question: "Do you provide emergency plumbing services in Halifax, MA?", answer: "Yes, Johnson Bros. provides 24/7 emergency plumbing services throughout Halifax, MA." },
    { question: "What areas of Halifax do you service?", answer: "We service all of Halifax and surrounding areas." },
    { question: "How much do plumbing services cost?", answer: "Service rates start at $125 for diagnostics. Drain cleaning starts at $99." },
    { question: "Are you licensed to work in Halifax?", answer: "Yes, we are fully licensed master plumbers in Massachusetts." }
  ];
  const breadcrumbs = [
    { name: "Home", url: "https://www.thejohnsonbros.com/" },
    { name: "Service Areas", url: "https://www.thejohnsonbros.com/service-areas" },
    { name: "Halifax", url: "https://www.thejohnsonbros.com/service-areas/halifax" }
  ];
  const localReviews = [
    { author: "Greg L. - Halifax", rating: 5, datePublished: "2024-11-16", reviewBody: "Reliable service and great communication!" },
    { author: "Janet D. - Halifax", rating: 5, datePublished: "2024-10-05", reviewBody: "Fixed our drain problem fast. Recommend!" }
  ];
  const services = [
    { name: "Emergency Plumbing Halifax", description: "24/7 emergency plumbing repairs" },
    { name: "Drain Cleaning Halifax", description: "Professional drain and sewer cleaning" },
    { name: "Water Heater Service Halifax", description: "Water heater repair and installation" },
    { name: "Pipe Repair Halifax", description: "Expert pipe repair and replacement" }
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
        <meta name="geo.placename" content="Halifax" />
        <meta name="geo.position" content="41.9912;-70.8618" />
        <meta name="ICBM" content="41.9912, -70.8618" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <LocalBusinessSchema serviceArea="Halifax" />
      <ServiceAreaSchema areaName="Halifax" services={services} />
      <FAQSchema questions={localFAQs} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ReviewSchema reviews={localReviews} aggregateRating={{ ratingValue: 4.8, reviewCount: 28 }} />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onBookService={() => {}} />
        <main className="flex-grow">
          <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <MapPin className="h-12 w-12" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">Plumber in Halifax, MA</h1>
                </div>
                <p className="text-xl sm:text-2xl mb-8 text-blue-100">Your trusted local plumbing experts serving Halifax and the South Shore</p>
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
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Complete Plumbing Services in Halifax, MA</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { title: "Emergency Plumbing", desc: "24/7 emergency service for burst pipes and leaks", link: "/services/general-plumbing" },
                    { title: "Drain Cleaning", desc: "Professional drain and sewer cleaning", link: "/services/drain-cleaning" },
                    { title: "Water Heater Service", desc: "Installation, repair, and maintenance", link: "/services/general-plumbing" },
                    { title: "Gas Heat Installation", desc: "Licensed gas fitters", link: "/services/gas-heat" },
                    { title: "New Construction", desc: "Complete plumbing for new builds", link: "/services/new-construction" },
                    { title: "Pipe Repair", desc: "Expert pipe repair and re-piping", link: "/services/general-plumbing" }
                  ].map((s, i) => (<Link key={i} href={s.link} className="group"><div className="p-6 border rounded-lg hover:shadow-lg h-full"><h3 className="text-xl font-semibold mb-2 group-hover:text-johnson-blue">{s.title}</h3><p className="text-gray-600">{s.desc}</p></div></Link>))}
                </div>
              </div>
            </div>
          </section>
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold text-center mb-12">Why Halifax Chooses Johnson Bros.</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[{ icon: Clock, title: "Fast Response", desc: "Same-day service" }, { icon: Shield, title: "Licensed & Insured", desc: "MA master plumbers" }, { icon: CheckCircle, title: "Local Experts", desc: "We know Halifax" }].map((f, i) => (<div key={i} className="text-center p-6 bg-white rounded-lg"><f.icon className="h-12 w-12 text-johnson-blue mx-auto mb-4" /><h3 className="text-xl font-semibold mb-3">{f.title}</h3><p className="text-gray-600">{f.desc}</p></div>))}
              </div>
            </div>
          </section>
          <NearbyServiceAreas currentArea="halifax" />
          <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Need a Plumber in Halifax Today?</h2>
              <p className="text-xl mb-8 text-blue-100">Call Halifax's trusted plumbing experts</p>
              <Button size="lg" className="bg-white text-johnson-blue hover:bg-gray-100 text-lg px-8 py-6" onClick={() => window.location.href = 'tel:6174799911'}><Phone className="mr-2" /> Call (617) 479-9911 Now</Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
