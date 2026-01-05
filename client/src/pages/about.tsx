import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { Phone, Users, Award, Clock, Shield, CheckCircle, Heart, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalBusinessSchema } from '@/components/schema-markup';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <LocalBusinessSchema 
        serviceArea={["Quincy", "Weymouth", "Braintree", "Plymouth", "Marshfield", "Hingham", "Abington", "Wollaston", "Squantum", "Houghs Neck"]}
      />
      <Helmet>
        <title>About Johnson Bros. Plumbing | Family-Owned Quincy MA Plumbers Since 2008</title>
        <meta name="description" content="Johnson Bros. Plumbing & Drain Cleaning is a family-owned business serving Quincy, MA & South Shore. Licensed (PL #17034-M), insured, and committed to quality. Call (617) 479-9911!" />
        <link rel="canonical" href="https://thejohnsonbros.com/about" />
        <meta property="og:title" content="About Johnson Bros. Plumbing | Family-Owned Quincy MA Plumbers" />
        <meta property="og:description" content="Family-owned and operated plumbing company serving Quincy & South Shore MA. Licensed, insured, and available 24/7." />
        <meta property="og:url" content="https://thejohnsonbros.com/about" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header onBookService={() => {}} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="heading-about">
            About Johnson Bros. Plumbing & Drain Cleaning
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Your local neighborhood Quincy plumbers, ready to tackle any plumbing issue 24/7. 
            Family-owned and operated with a commitment to integrity and customer-first service.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold">4.8 Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold">314+ Reviews</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="font-semibold">Licensed & Insured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-6">
              At Johnson Bros. Plumbing & Drain Cleaning, we're more than just plumbers—we're your neighbors. 
              As a family-owned business, we prioritize building lasting relationships with our customers. 
              We treat every job as if it were in our own home, providing the utmost care and attention to detail.
            </p>
            <p className="mb-6">
              We are proud to serve Quincy, Greater Boston, and the South Shore. As your neighborhood plumbers, 
              we are familiar with the unique plumbing needs of the area and are always just a phone call away.
            </p>
            <p>
              Our commitment to providing prompt and reliable service extends beyond regular business hours. 
              We know that plumbing emergencies can't wait, and that's why we're here to respond swiftly 
              and efficiently, ensuring that your plumbing issues are resolved without delay.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Johnson Bros?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Users className="w-12 h-12 text-johnson-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Family-Owned & Operated</h3>
              <p className="text-gray-600">
                We prioritize building lasting relationships and treat every job like it's in our own home.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Clock className="w-12 h-12 text-johnson-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Open 24/7</h3>
              <p className="text-gray-600">
                Plumbing emergencies don't wait for business hours. We're available around the clock.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Shield className="w-12 h-12 text-johnson-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Licensed & Insured</h3>
              <p className="text-gray-600">
                MA License PL #17034-M, Corp #4581. Fully insured for your protection and peace of mind.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Heart className="w-12 h-12 text-johnson-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Customer First</h3>
              <p className="text-gray-600">
                We deliver quick, efficient solutions with integrity, putting your needs first every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Commitment to You</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-2xl font-semibold mb-4 text-johnson-blue">Your Time Matters</h3>
              <p className="text-gray-600 mb-4">
                We know your time is precious. That's why our dedicated technicians work around your schedule, 
                ensuring minimal disruption. Expect prompt arrivals and courteous service, complete with a 
                call ahead to let you know we're on our way.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-2xl font-semibold mb-4 text-johnson-blue">Respect for Your Home</h3>
              <p className="text-gray-600 mb-4">
                Our team treats every home as if it were their own. Protective gear like shoe covers and 
                floor tarps are standard, ensuring that your space looks just as pristine after the work is done.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-2xl font-semibold mb-4 text-johnson-blue">Satisfaction Guaranteed</h3>
              <p className="text-gray-600 mb-4">
                We're not content until you are. Our commitment extends beyond the first service — if you're 
                not fully satisfied with our work or materials within the first year, we pledge to address 
                your concerns without hesitation.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-2xl font-semibold mb-4 text-johnson-blue">One-Year Guarantee</h3>
              <p className="text-gray-600 mb-4">
                We stand by the quality of our work. Should you face any problems within the first year of 
                service, just give us a call, and our expert technicians will promptly address the problem 
                at no additional cost to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Locations</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <MapPin className="w-8 h-8 text-johnson-blue flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Quincy Office</h3>
                  <p className="text-gray-600 mb-2">75 East Elm Ave</p>
                  <p className="text-gray-600 mb-4">Quincy, MA 02170</p>
                  <a 
                    href="https://maps.app.goo.gl/65wd4toecNfd1Qeo7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-johnson-blue hover:underline"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <MapPin className="w-8 h-8 text-johnson-blue flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Abington Office</h3>
                  <p className="text-gray-600 mb-2">55 Brighton St</p>
                  <p className="text-gray-600 mb-4">Abington, MA 02351</p>
                  <a 
                    href="https://maps.app.goo.gl/GPfqvtdFTxTuZXui6" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-johnson-blue hover:underline"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Credentials & Licenses</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="font-semibold">MA Plumbing License</p>
              <p className="text-gray-600">PL #17034-M</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="font-semibold">Corporation</p>
              <p className="text-gray-600">Corp #4581</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="font-semibold">Fully Insured</p>
              <p className="text-gray-600">Liability & Workers Comp</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="font-semibold">Google Guaranteed</p>
              <p className="text-gray-600">Verified Business</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience the Johnson Bros. Difference?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Our friendly staff is available 24/7 to answer your calls and questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-johnson-blue hover:bg-gray-100 text-lg py-6 px-8"
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
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-johnson-blue text-lg py-6 px-8"
              asChild
            >
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-blue-200">
            Email: Sales@TheJohnsonBros.com
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
