import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { Phone, Thermometer, Flame, Clock, Shield, CheckCircle, Droplets, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalBusinessSchema, FAQSchema } from '@/components/schema-markup';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const heatingFAQs = [
  {
    question: "What is a combi boiler?",
    answer: "Combi boilers are a compact and high-efficiency system that provides both heat and hot water from one unit, making it a popular choice in modern homes. They save space and can be more energy-efficient than traditional systems."
  },
  {
    question: "How long does a water heater usually last?",
    answer: "Traditional water heaters typically last 10-12 years, while tankless systems can last 20 years or more with proper maintenance. Regular maintenance can extend the life of your water heater significantly."
  },
  {
    question: "What's the difference between a steam boiler and a forced hot water boiler?",
    answer: "A steam boiler heats water until it turns into steam, which is then distributed to radiators. A forced hot water boiler heats water and pumps it around your home through pipes to radiators or baseboard heaters."
  },
  {
    question: "Can I install a tankless water heater myself?",
    answer: "While technically possible, we strongly recommend professional installation to ensure safety, efficiency, and a correct setup. Improper installation can void warranties and create safety hazards."
  },
  {
    question: "What should I do if my boiler isn't heating my home properly?",
    answer: "If your boiler isn't providing enough heat, it's time to call a professional. It could be a simple fix like bleeding radiators, or it could indicate a more serious issue that needs attention. Johnson Bros. Plumbing & Drain Cleaning is always ready to help."
  },
  {
    question: "What are signs I need a new water heater?",
    answer: "Common signs include: your system is over 10 years old, uneven or inconsistent heating, unexplainably high utility bills, strange or loud noises, rusty water, or visible leaks around the tank."
  }
];

export default function HeatingServices() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham", "Abington", "Wollaston", "Squantum"]}
        service={{
          name: "Heating & Water Heater Services",
          description: "Expert water heater repair, replacement, installation. Tankless upgrades, combi-boiler service, and boiler repair across South Shore Massachusetts",
          url: "https://thejohnsonbros.com/services/heating"
        }}
      />
      <FAQSchema questions={heatingFAQs} />
      <Helmet>
        <title>Heating & Water Heater Services Quincy MA | Boiler Repair | Johnson Bros.</title>
        <meta name="description" content="Expert heating services in Quincy, MA & South Shore. Water heater repair & installation, tankless upgrades, combi-boiler service, boiler repair. 24/7 emergency service. Call (617) 479-9911!" />
        <link rel="canonical" href="https://thejohnsonbros.com/services/heating" />
        <meta property="og:title" content="Heating & Water Heater Services South Shore MA | Johnson Bros." />
        <meta property="og:description" content="Expert heating services including water heater repair, tankless upgrades, combi-boiler service. Licensed professionals serving Quincy & South Shore MA." />
        <meta property="og:url" content="https://thejohnsonbros.com/services/heating" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header onBookService={() => {}} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="heading-heating">
              Heating & Water Heater Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-6 text-orange-50">
            Expert Repair, Installation & Maintenance in Quincy, Weymouth, Plymouth & South Shore MA
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg py-6 px-8"
              data-testid="button-call-heating"
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
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600 text-lg py-6 px-8"
              data-testid="button-book-heating"
              asChild
            >
              <Link href="/book">
                Schedule Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            Maximize the impact of your next heating service with Johnson Bros. Plumbing & Drain Cleaning. 
            Step beyond cookie-cutter solutions and embrace personalized solutions defined by high-quality 
            products and time-honored workmanship. Our full-service approach enables us to take on everything 
            from heating repair to new installations, preventative maintenance, and emergency service.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-heating-services">
            Comprehensive Heating & Water Heater Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card data-testid="service-water-heater">
              <CardHeader>
                <Droplets className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Water Heater Repair & Replacement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Fast diagnosis and repair of all water heater issues. When repair isn't cost-effective, 
                  we provide expert replacement with quality units that fit your budget and needs.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-tankless">
              <CardHeader>
                <Settings className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Tankless Water Heater Upgrades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Upgrade to endless hot water with a tankless system. These energy-efficient units 
                  can last 20+ years and reduce your utility bills while providing hot water on demand.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-combi">
              <CardHeader>
                <Flame className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Combi-Boiler Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Repair, replacement, and installation of combi-boilers - the compact, high-efficiency 
                  solution that provides both heat and hot water from a single unit.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-steam">
              <CardHeader>
                <Thermometer className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Steam Boiler Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Expert service for steam boiler systems including installation, diagnostics, 
                  repair, and preventative maintenance to keep your home warm all winter.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-forced-hot">
              <CardHeader>
                <Flame className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Forced Hot Water Boilers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Complete service for forced hot water systems. We handle installation, 
                  repair, and annual tune-ups for efficient, reliable heating.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="service-maintenance">
              <CardHeader>
                <Shield className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Preventative Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Proactive maintenance plans to minimize costly repairs and premature replacements. 
                  Routine inspections, cleanings, and tune-ups to extend your system's life.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Warning Signs Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-12 h-12 text-orange-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-4">Signs You Need Heating Service</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <span>System is over 10 years old</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <span>Uneven or inconsistent heating</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <span>Unexplainably high utility bills</span>
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <span>Irregular airflow</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <span>Strange or loud noises</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <span>Rusty water or visible leaks</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Boilers Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose a Boiler System?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Energy Efficiency</h3>
              <p className="text-gray-600">
                Modern boiler systems are highly efficient, helping reduce your heating costs 
                while keeping your home comfortable all winter long.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Even Heating</h3>
              <p className="text-gray-600">
                Boilers provide consistent, even heat throughout your home without the 
                drafty air circulation of forced-air systems.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">No Complicated Ductwork</h3>
              <p className="text-gray-600">
                Boiler systems don't require ductwork, making them ideal for older homes 
                or additions where installing ducts would be difficult.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="heading-faq">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {heatingFAQs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6" data-testid={`faq-${index}`}>
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't Wait Until Winter to Fix Your Heating
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Get ahead of your heating repair needs and invest in uninterrupted comfort with 
            Johnson Bros. Plumbing & Drain Cleaning. Contact us for your complimentary estimate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg py-6 px-8"
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
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600 text-lg py-6 px-8"
              asChild
            >
              <Link href="/contact">
                Request a Quote
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <WhyChooseUs serviceName="heating" />
      <Footer />
    </div>
  );
}
