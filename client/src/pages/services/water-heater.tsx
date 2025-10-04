import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { Phone, Droplets, Thermometer, Clock, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WaterHeater() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Helmet>
        <title>Water Heater Repair & Installation South Shore MA | Johnson Bros.</title>
        <meta name="description" content="Expert water heater repair, replacement & installation in Quincy, Weymouth, Plymouth, Braintree MA. Tank & tankless systems. Same-day service. Call (617) 479-9911!" />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/water-heater" />
        <meta property="og:title" content="Water Heater Repair & Installation South Shore MA | Johnson Bros." />
        <meta property="og:description" content="Expert water heater repair, replacement & installation in Quincy, Weymouth, Plymouth, Braintree MA. Tank & tankless systems. Same-day service." />
        <meta property="og:url" content="https://johnsonbrosplumbing.com/services/water-heater" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="heading-water-heater">
              Water Heater Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-6 text-blue-50">
            Expert Repair, Replacement & Installation in Quincy, Weymouth, Plymouth & South Shore MA
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg py-6 px-8"
              data-testid="button-call-water-heater"
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
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg py-6 px-8"
              data-testid="button-book-water-heater"
              asChild
            >
              <Link href="/book">
                Schedule Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Water Heater Services */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-services">
            Comprehensive Water Heater Services
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card data-testid="service-repair">
              <CardHeader>
                <Droplets className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Water Heater Repair</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>No hot water troubleshooting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Pilot light and ignition repair</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Thermostat replacement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Pressure relief valve service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Heating element replacement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="service-installation">
              <CardHeader>
                <Shield className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>New Installation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tank water heaters (30-80 gal)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tankless water heaters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Gas and electric models</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Energy-efficient upgrades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Proper sizing consultation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="service-replacement">
              <CardHeader>
                <Clock className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Replacement Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Same-day replacement available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Old unit removal & disposal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Code-compliant installation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Upgrade from tank to tankless</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Warranty on parts and labor</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Signs You Need Service */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-warning-signs">
            Signs Your Water Heater Needs Service
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="warning-no-hot-water">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">No Hot Water or Insufficient Heat</h3>
                    <p className="text-gray-600">Running out of hot water quickly or no hot water at all indicates a failing heating element, thermostat, or sediment buildup in your tank.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="warning-leaking">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Leaking Water Around the Unit</h3>
                    <p className="text-gray-600">Any pooling water around your water heater is a serious issue requiring immediate attention to prevent water damage and potential <Link href="/services/emergency-plumbing" className="text-blue-600 hover:underline">emergency situations</Link>.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="warning-rusty-water">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Rusty or Discolored Water</h3>
                    <p className="text-gray-600">Rust-colored hot water indicates corrosion inside the tank. This often means the tank is deteriorating and replacement may be necessary soon.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="warning-strange-noises">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Strange Noises (Popping, Rumbling)</h3>
                    <p className="text-gray-600">Loud popping or rumbling sounds indicate sediment buildup at the bottom of your tank, reducing efficiency and potentially damaging the unit.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="warning-age">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Age Over 10-12 Years</h3>
                    <p className="text-gray-600">Water heaters typically last 10-15 years. If yours is approaching this age and showing issues, replacement is often more cost-effective than repair.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="warning-high-bills">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Rising Energy Bills</h3>
                    <p className="text-gray-600">An inefficient water heater works harder and costs more to operate. Upgrading to a new energy-efficient model can save you money monthly.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tank vs Tankless */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-tank-vs-tankless">
            Tank vs. Tankless Water Heaters
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card data-testid="card-tank">
              <CardHeader>
                <CardTitle className="text-2xl">Traditional Tank Water Heaters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-700 mb-2">Advantages:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Lower upfront cost</li>
                      <li>• Simpler installation</li>
                      <li>• Familiar technology</li>
                      <li>• Can supply multiple fixtures simultaneously</li>
                      <li>• Available in gas or electric</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 mb-2">Considerations:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Limited hot water capacity</li>
                      <li>• Takes up more space</li>
                      <li>• 10-15 year lifespan</li>
                      <li>• Higher energy costs</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    <strong>Best for:</strong> Families with predictable hot water needs, homes with existing tank setups, and budget-conscious installations in <Link href="/service-areas/braintree" className="text-blue-600 hover:underline">Braintree</Link>, <Link href="/service-areas/plymouth" className="text-blue-600 hover:underline">Plymouth</Link>, and South Shore homes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-tankless">
              <CardHeader>
                <CardTitle className="text-2xl">Tankless Water Heaters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-700 mb-2">Advantages:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Endless hot water on demand</li>
                      <li>• 30-50% more energy efficient</li>
                      <li>• Space-saving wall mount</li>
                      <li>• 20+ year lifespan</li>
                      <li>• Lower monthly energy costs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 mb-2">Considerations:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Higher upfront investment</li>
                      <li>• May require <Link href="/services/gas-heat" className="text-blue-600 hover:underline">gas line upgrades</Link></li>
                      <li>• Flow rate limitations</li>
                      <li>• Complex installation</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    <strong>Best for:</strong> Energy-conscious homeowners, families with high hot water demand, space-limited installations in <Link href="/service-areas/quincy" className="text-blue-600 hover:underline">Quincy</Link>, <Link href="/service-areas/hingham" className="text-blue-600 hover:underline">Hingham</Link>, and modern South Shore homes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Local Service Areas */}
      <section className="py-12 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-service-areas">
            Water Heater Services Across South Shore Massachusetts
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
            From emergency repairs to new tankless installations, Johnson Bros. provides expert water heater services throughout the South Shore. Whether you're in a historic Quincy home or a new construction in Plymouth, we have the experience and equipment to handle your water heater needs.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/service-areas/quincy" data-testid="link-quincy">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Quincy Water Heater Service</h3>
                  <p className="text-gray-600 text-sm">Expert water heater repair and replacement in all Quincy neighborhoods</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/weymouth" data-testid="link-weymouth">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Weymouth Water Heater Service</h3>
                  <p className="text-gray-600 text-sm">Tank and tankless installation throughout Weymouth</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/service-areas/marshfield" data-testid="link-marshfield">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Marshfield Water Heater Service</h3>
                  <p className="text-gray-600 text-sm">Reliable water heater services for Marshfield coastal homes</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Johnson Bros */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-why-choose">
            Why Choose Johnson Bros. for Water Heater Service?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="benefit-experience">
              <CardContent className="pt-6 text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Licensed Experts</h3>
                <p className="text-gray-600 text-sm">Master plumbers with extensive water heater training</p>
              </CardContent>
            </Card>

            <Card data-testid="benefit-service">
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Same-Day Service</h3>
                <p className="text-gray-600 text-sm">Fast response times across the South Shore</p>
              </CardContent>
            </Card>

            <Card data-testid="benefit-quality">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Quality Brands</h3>
                <p className="text-gray-600 text-sm">Rheem, Bradford White, Rinnai, and more</p>
              </CardContent>
            </Card>

            <Card data-testid="benefit-warranty">
              <CardContent className="pt-6 text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Warranty Protection</h3>
                <p className="text-gray-600 text-sm">Comprehensive warranties on parts and labor</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Thermometer className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-final-cta">
            Need Water Heater Service Today?
          </h2>
          <p className="text-xl mb-8 text-blue-50">
            From repairs to new installations, we're South Shore's trusted water heater experts. Call now for fast, professional service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg py-6 px-8"
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
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg py-6 px-8"
              data-testid="button-all-services"
              asChild
            >
              <Link href="/services/general-plumbing">
                View All Plumbing Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
