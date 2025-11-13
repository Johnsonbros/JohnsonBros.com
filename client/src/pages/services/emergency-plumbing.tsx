import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { Phone, Clock, AlertCircle, Wrench, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalBusinessSchema } from '@/components/schema-markup';
import { MCPIntegrationBanner } from '@/components/MCPIntegrationBanner';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import emergencyWaterHeaterImg from '@assets/emergency_1763062911389.jpg';
import coldShowerImg from '@assets/2-woman-shocked-with-cold-water-while-taking-a-shower-as-a-result-of-a-faulty-circulator-pump-300x200_1763063444910.jpg';

export default function EmergencyPlumbing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham", "Abington"]}
        service={{
          name: "24/7 Emergency Plumbing Services",
          description: "Emergency plumber available 24/7 for burst pipes, flooding, sewage backups, gas leaks, and all plumbing emergencies across South Shore Massachusetts",
          url: "https://johnsonbrosplumbing.com/services/emergency-plumbing"
        }}
      />
      <Helmet>
        <title>24/7 Emergency Plumber South Shore MA | Johnson Bros. Plumbing</title>
        <meta name="description" content="Emergency plumber available 24/7 in Quincy, Weymouth, Braintree, Plymouth & South Shore MA. Fast response for burst pipes, flooding, gas leaks. Call (617) 479-9911 now!" />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/emergency-plumbing" />
        <meta property="og:title" content="24/7 Emergency Plumber South Shore MA | Johnson Bros. Plumbing" />
        <meta property="og:description" content="Emergency plumber available 24/7 in Quincy, Weymouth, Braintree, Plymouth & South Shore MA. Fast response for burst pipes, flooding, gas leaks." />
        <meta property="og:url" content="https://johnsonbrosplumbing.com/services/emergency-plumbing" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-red-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="heading-emergency">
              24/7 Emergency Plumber
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-6 text-red-50">
            Serving Quincy, Weymouth, Braintree, Plymouth & All of South Shore Massachusetts
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-white text-red-600 hover:bg-gray-100 text-lg py-6 px-8"
              data-testid="button-call-emergency"
              asChild
            >
              <a href="tel:6174799911">
                <Phone className="mr-2 h-5 w-5" />
                Call Now: (617) 479-9911
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-red-600 text-lg py-6 px-8"
              data-testid="button-book-emergency"
              asChild
            >
              <Link href="/book">
                <Clock className="mr-2 h-5 w-5" />
                Book Emergency Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us for Emergencies */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <MCPIntegrationBanner variant="compact" />
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-why-choose">
            Why Choose Johnson Bros. for Plumbing Emergencies?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card data-testid="card-response-time">
              <CardHeader>
                <Clock className="w-10 h-10 text-red-600 mb-2" />
                <CardTitle>Rapid Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We arrive within 60-90 minutes for most South Shore emergencies. Our trucks are stocked and ready to handle any plumbing crisis.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-24-7">
              <CardHeader>
                <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
                <CardTitle>Available 24/7/365</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Plumbing emergencies don't wait for business hours. We're available nights, weekends, and holidays throughout the South Shore.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-experienced">
              <CardHeader>
                <Shield className="w-10 h-10 text-red-600 mb-2" />
                <CardTitle>Licensed & Insured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Master plumbers with decades of experience. Fully licensed, insured, and bonded for your protection and peace of mind.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Visual Emergency Examples */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Real Emergency Situations We Handle Daily
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={emergencyWaterHeaterImg} 
                alt="Emergency water heater leak requiring immediate repair" 
                className="w-full h-64 object-cover"
                data-testid="img-emergency-water-heater"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-semibold">Water Heater Emergency - Basement Flooding</p>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={coldShowerImg} 
                alt="No hot water emergency requiring immediate plumber response" 
                className="w-full h-64 object-cover"
                data-testid="img-cold-shower"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-semibold">No Hot Water? We're Available 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Services */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-emergency-services">
            Emergency Plumbing Services We Handle
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="service-burst-pipes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Burst & Frozen Pipes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Immediate response to burst or frozen pipes causing flooding. We stop the water, repair the damage, and prevent future freezing in Quincy, Weymouth, and throughout the South Shore.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-sewage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Sewage Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Fast response to sewage backups and overflows. We handle the dirty work safely with professional <Link href="/services/drain-cleaning" className="text-blue-600 hover:underline">drain cleaning</Link> equipment.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-water-heater">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Water Heater Failures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No hot water? Leaking water heater? We provide emergency <Link href="/services/water-heater" className="text-blue-600 hover:underline">water heater repair and replacement</Link> 24/7 across Braintree, Plymouth, and the South Shore.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-gas-leaks">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Gas Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Smell gas? Evacuate immediately and call us. Our licensed <Link href="/services/gas-heat" className="text-blue-600 hover:underline">gas technicians</Link> respond urgently to locate and repair gas leaks safely.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-flooding">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Basement Flooding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sump pump failure? Pipe burst? We respond quickly to basement flooding emergencies with powerful pumps and expert <Link href="/services/pipe-repair" className="text-blue-600 hover:underline">pipe repair</Link> services.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-major-leaks">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Major Leaks & Water Damage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  From leaking toilets to ruptured supply lines, we stop the water fast and minimize damage to your Marshfield, Hingham, or South Shore property.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Area Highlights */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-service-areas">
            Emergency Plumbing Coverage Across South Shore MA
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/service-areas/quincy" data-testid="link-quincy">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Quincy Emergency Plumber</h3>
                  <p className="text-gray-600 text-sm">24/7 service in North Quincy, Wollaston, Quincy Center, Marina Bay</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/weymouth" data-testid="link-weymouth">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Weymouth Emergency Plumber</h3>
                  <p className="text-gray-600 text-sm">Fast response in East Weymouth, South Weymouth, North Weymouth</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/braintree" data-testid="link-braintree">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Braintree Emergency Plumber</h3>
                  <p className="text-gray-600 text-sm">Rapid emergency service throughout all Braintree neighborhoods</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/plymouth" data-testid="link-plymouth">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Plymouth Emergency Plumber</h3>
                  <p className="text-gray-600 text-sm">Emergency coverage in Plymouth Center, Manomet, Cedarville</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/marshfield" data-testid="link-marshfield">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Marshfield Emergency Plumber</h3>
                  <p className="text-gray-600 text-sm">24/7 emergency service in Marshfield Hills, Brant Rock, Ocean Bluff</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/hingham" data-testid="link-hingham">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Hingham Emergency Plumber</h3>
                  <p className="text-gray-600 text-sm">Quick emergency response throughout Hingham and surrounding areas</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* What to Do Section */}
      <section className="py-12 px-4 bg-red-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-what-to-do">
            What to Do During a Plumbing Emergency
          </h2>
          <div className="space-y-4">
            <Card data-testid="step-1">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Shut Off the Water</h3>
                    <p className="text-gray-600">Locate your main water shutoff valve (usually in the basement or crawl space) and turn it clockwise to stop water flow.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="step-2">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Call Johnson Bros. Immediately</h3>
                    <p className="text-gray-600">Dial <a href="tel:6174799911" className="text-red-600 font-bold hover:underline">(617) 479-9911</a> for 24/7 emergency service. Our team will be dispatched right away.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="step-3">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Minimize Damage</h3>
                    <p className="text-gray-600">Move valuables away from water, turn off electricity if water is near outlets, and place towels or buckets to contain leaks.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="step-4">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Document for Insurance</h3>
                    <p className="text-gray-600">Take photos of the damage for insurance claims. We'll provide detailed documentation of repairs for your records.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Wrench className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-final-cta">
            Don't Wait - Call for Emergency Service Now
          </h2>
          <p className="text-xl mb-8 text-red-50">
            Every minute counts during a plumbing emergency. Our expert team is standing by 24/7 to help South Shore homeowners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-red-600 hover:bg-gray-100 text-lg py-6 px-8"
              data-testid="button-call-final"
              asChild
            >
              <a href="tel:6174799911">
                <Phone className="mr-2 h-5 w-5" />
                Emergency: (617) 479-9911
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-red-600 text-lg py-6 px-8"
              data-testid="button-services"
              asChild
            >
              <Link href="/services/general-plumbing">
                View All Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
