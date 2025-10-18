import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { Phone, Wrench, Droplet, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalBusinessSchema } from '@/components/schema-markup';
import { WhyChooseUs } from '@/components/WhyChooseUs';

export default function PipeRepair() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham"]}
        service={{
          name: "Pipe Repair, Replacement & Repiping Services",
          description: "Professional pipe repair, replacement, and whole-house repiping services. Expert leak detection and repair for copper, PEX, PVC, and galvanized pipes",
          url: "https://johnsonbrosplumbing.com/services/pipe-repair"
        }}
      />
      <Helmet>
        <title>Pipe Repair & Replacement South Shore MA | Johnson Bros. Plumbing</title>
        <meta name="description" content="Professional pipe repair, replacement & repiping in Quincy, Weymouth, Braintree, Plymouth MA. Copper, PEX & PVC pipes. Fix leaks fast. Call (617) 479-9911!" />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/pipe-repair" />
        <meta property="og:title" content="Pipe Repair & Replacement South Shore MA | Johnson Bros. Plumbing" />
        <meta property="og:description" content="Professional pipe repair, replacement & repiping in Quincy, Weymouth, Braintree, Plymouth MA. Copper, PEX & PVC pipes. Fix leaks fast." />
        <meta property="og:url" content="https://johnsonbrosplumbing.com/services/pipe-repair" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="heading-pipe-repair">
              Pipe Repair & Replacement
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-6 text-slate-200">
            Expert Pipe Services for Quincy, Weymouth, Braintree, Plymouth & All South Shore MA
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-white text-slate-700 hover:bg-gray-100 text-lg py-6 px-8"
              data-testid="button-call-pipe"
              asChild
            >
              <a href="tel:6174799911">
                <Phone className="mr-2 h-5 w-5" />
                Call: (617) 479-9911
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-slate-700 text-lg py-6 px-8"
              data-testid="button-book-pipe"
              asChild
            >
              <Link href="/book">
                Schedule Repair
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-pipe-services">
            Complete Pipe Repair & Replacement Services
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card data-testid="service-leak-repair">
              <CardHeader>
                <Droplet className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Leak Detection & Repair</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Advanced leak detection technology</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Hidden pipe leak location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Pinhole leak repair</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Slab leak detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Wall and ceiling pipe repairs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="service-pipe-replacement">
              <CardHeader>
                <Wrench className="w-10 h-10 text-slate-600 mb-2" />
                <CardTitle>Pipe Replacement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Copper pipe replacement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>PEX piping installation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Galvanized pipe upgrades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>PVC drain pipe replacement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Cast iron to PVC conversion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="service-repiping">
              <CardHeader>
                <Shield className="w-10 h-10 text-green-600 mb-2" />
                <CardTitle>Whole-House Repiping</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Complete home repiping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Modernize old plumbing systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Increase water pressure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Prevent future pipe failures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Minimal wall/floor disruption</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Common Pipe Problems */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-pipe-problems">
            Common Pipe Problems We Fix
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="problem-burst">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Burst & Frozen Pipes</h3>
                    <p className="text-gray-600">
                      South Shore winters can freeze pipes, causing them to burst. We provide <Link href="/services/emergency-plumbing" className="text-blue-600 hover:underline">24/7 emergency repair</Link> for burst pipes in Quincy, Weymouth, and throughout the area to prevent extensive water damage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="problem-corrosion">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Corroded & Rusted Pipes</h3>
                    <p className="text-gray-600">
                      Older South Shore homes often have galvanized or copper pipes showing signs of corrosion. We replace deteriorating pipes with modern, long-lasting materials like PEX or copper.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="problem-leaks">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Persistent Leaks</h3>
                    <p className="text-gray-600">
                      Water stains on walls or ceilings? High water bills? We use advanced leak detection to find hidden leaks behind walls, under slabs, and in ceilings throughout Braintree, Plymouth, and South Shore homes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="problem-pressure">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Low Water Pressure</h3>
                    <p className="text-gray-600">
                      Low water pressure often indicates corroded pipes or buildup restricting flow. We diagnose the cause and replace problem sections or repipe your home for improved water flow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="problem-noisy">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Noisy Pipes</h3>
                    <p className="text-gray-600">
                      Banging, rattling, or whistling pipes indicate loose mounting, water hammer, or high pressure. We secure pipes properly and install pressure regulators as needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="problem-root">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Root Intrusion</h3>
                    <p className="text-gray-600">
                      Tree roots can infiltrate older drain pipes causing clogs and damage. We provide <Link href="/services/drain-cleaning" className="text-blue-600 hover:underline">drain cleaning services</Link> and pipe replacement to eliminate root problems permanently.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pipe Materials */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-pipe-materials">
            Pipe Materials We Work With
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="material-copper">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-center">Copper Pipes</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Durable, reliable, and long-lasting. Copper is the gold standard for water supply lines in South Shore homes.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 50+ year lifespan</li>
                  <li>✓ Heat resistant</li>
                  <li>✓ Natural antimicrobial</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="material-pex">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-center">PEX Pipes</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Flexible, freeze-resistant, and cost-effective. PEX is ideal for repiping projects and new installations.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Flexible installation</li>
                  <li>✓ Freeze resistant</li>
                  <li>✓ Lower cost</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="material-pvc">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-center">PVC Pipes</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Standard for drain, waste, and vent lines. Durable, corrosion-resistant, and long-lasting.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Excellent for drains</li>
                  <li>✓ Won't corrode</li>
                  <li>✓ Easy maintenance</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="material-cast-iron">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-center">Cast Iron Pipes</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Common in older South Shore homes. We repair or replace deteriorating cast iron with modern materials.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Found in older homes</li>
                  <li>✓ We upgrade to PVC</li>
                  <li>✓ Eliminates corrosion</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-service-areas">
            Pipe Repair Services Throughout South Shore Massachusetts
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
            From emergency pipe repairs to whole-house repiping, Johnson Bros. serves homeowners throughout the South Shore. We understand the unique plumbing challenges of coastal homes and older properties in our service area.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/service-areas/quincy" data-testid="link-quincy">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Quincy Pipe Repair</h3>
                  <p className="text-gray-600 text-sm">Expert pipe repair and replacement for historic and modern Quincy homes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/weymouth" data-testid="link-weymouth">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Weymouth Pipe Repair</h3>
                  <p className="text-gray-600 text-sm">Reliable pipe services throughout all Weymouth neighborhoods</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/braintree" data-testid="link-braintree">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Braintree Pipe Repair</h3>
                  <p className="text-gray-600 text-sm">Professional pipe repair and repiping for Braintree properties</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/plymouth" data-testid="link-plymouth">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Plymouth Pipe Repair</h3>
                  <p className="text-gray-600 text-sm">Comprehensive pipe services for Plymouth homes and businesses</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/marshfield" data-testid="link-marshfield">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Marshfield Pipe Repair</h3>
                  <p className="text-gray-600 text-sm">Protecting Marshfield coastal properties with expert pipe repair</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/hingham" data-testid="link-hingham">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Hingham Pipe Repair</h3>
                  <p className="text-gray-600 text-sm">Quality pipe repair and replacement throughout Hingham</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-why-choose">
            Why Trust Johnson Bros. for Pipe Repair?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="benefit-detection">
              <CardContent className="pt-6 text-center">
                <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Advanced Detection</h3>
                <p className="text-gray-600 text-sm">Electronic leak detection finds hidden pipe problems</p>
              </CardContent>
            </Card>

            <Card data-testid="benefit-minimal">
              <CardContent className="pt-6 text-center">
                <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Minimal Disruption</h3>
                <p className="text-gray-600 text-sm">Strategic repairs preserve your walls and floors</p>
              </CardContent>
            </Card>

            <Card data-testid="benefit-emergency">
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Emergency Service</h3>
                <p className="text-gray-600 text-sm">24/7 availability for pipe emergencies</p>
              </CardContent>
            </Card>

            <Card data-testid="benefit-quality">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Quality Materials</h3>
                <p className="text-gray-600 text-sm">Premium pipes and fittings for lasting repairs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Johnson Bros Section */}
      <WhyChooseUs serviceName="pipe-repair" />

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Wrench className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-final-cta">
            Need Professional Pipe Repair?
          </h2>
          <p className="text-xl mb-8 text-slate-200">
            From small leaks to whole-house repiping, we're South Shore's trusted pipe repair experts. Get fast, reliable service today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-slate-700 hover:bg-gray-100 text-lg py-6 px-8"
              data-testid="button-call-final"
              asChild
            >
              <a href="tel:6174799911">
                <Phone className="mr-2 h-5 w-5" />
                Call: (617) 479-9911
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-slate-700 text-lg py-6 px-8"
              data-testid="button-all-services"
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
