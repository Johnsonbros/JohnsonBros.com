/**
 * Terms of Service Page
 *
 * Legal terms governing the use of Johnson Bros. Plumbing services.
 */

import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

export default function TermsOfServicePage() {
  const lastUpdated = 'January 24, 2026';
  const effectiveDate = 'January 24, 2026';

  return (
    <>
      <Helmet>
        <title>Terms of Service | Johnson Bros. Plumbing & Drain Cleaning</title>
        <meta
          name="description"
          content="Read the terms of service governing the use of Johnson Bros. Plumbing & Drain Cleaning services."
        />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-johnson-blue/10 rounded-full mb-6">
                <FileText className="w-8 h-8 text-johnson-blue" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Terms of Service
              </h1>
              <p className="text-lg text-gray-600">
                Please read these terms carefully before using our services.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Last Updated: {lastUpdated} | Effective: {effectiveDate}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-gray">
              {/* Acceptance of Terms */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">1.</span> Acceptance of Terms
                </h2>
                <p className="text-gray-600">
                  By accessing our website or using the services provided by Johnson Bros.
                  Plumbing & Drain Cleaning ("Company", "we", "us", or "our"), you agree
                  to be bound by these Terms of Service ("Terms"). If you do not agree to
                  these Terms, please do not use our services.
                </p>
                <p className="text-gray-600">
                  We reserve the right to modify these Terms at any time. Your continued
                  use of our services after any modifications indicates your acceptance
                  of the updated Terms.
                </p>
              </section>

              {/* Services Description */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">2.</span> Services Description
                </h2>
                <p className="text-gray-600">
                  Johnson Bros. Plumbing & Drain Cleaning provides residential and
                  commercial plumbing services in the South Shore Massachusetts area,
                  including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Emergency plumbing repairs</li>
                  <li>Drain cleaning and unclogging</li>
                  <li>Water heater installation and repair</li>
                  <li>Pipe repair and replacement</li>
                  <li>Heating system service</li>
                  <li>New construction plumbing</li>
                  <li>General plumbing maintenance</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  Our services are subject to availability, technician scheduling, and
                  service area limitations as described on our website.
                </p>
              </section>

              {/* User Responsibilities */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">3.</span> User Responsibilities
                </h2>
                <p className="text-gray-600">When using our services, you agree to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Provide accurate and complete information when scheduling services</li>
                  <li>Ensure safe access to the work area for our technicians</li>
                  <li>Be present or have an authorized adult present during service calls</li>
                  <li>Inform us of any known hazards or special conditions at the property</li>
                  <li>Pay for services as agreed upon in the service estimate</li>
                  <li>Not interfere with or hinder our technicians during service</li>
                </ul>
              </section>

              {/* Scheduling and Cancellation */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">4.</span> Scheduling and Cancellation
                </h2>
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Appointments
                </h3>
                <p className="text-gray-600">
                  Appointments are scheduled based on availability. We provide estimated
                  arrival windows and will make reasonable efforts to arrive within the
                  scheduled time. Delays may occur due to prior jobs, traffic, or
                  emergency calls.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Cancellation Policy
                </h3>
                <p className="text-gray-600">
                  We request at least 24 hours' notice for appointment cancellations.
                  Same-day cancellations or no-shows may be subject to a cancellation
                  fee. Emergency service cancellations are handled on a case-by-case basis.
                </p>
              </section>

              {/* Payment Terms */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">5.</span> Payment Terms
                </h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>
                    <strong>Estimates:</strong> We provide estimates for work to be performed.
                    Estimates are valid for 30 days unless otherwise specified.
                  </li>
                  <li>
                    <strong>Service Call Fees:</strong> A service call fee may apply for
                    diagnostic visits. This fee is typically waived if you proceed with repairs.
                  </li>
                  <li>
                    <strong>Payment Methods:</strong> We accept cash, check, and major
                    credit cards. Payment is due upon completion of service.
                  </li>
                  <li>
                    <strong>Additional Work:</strong> If additional work is discovered
                    during service, we will obtain your approval before proceeding.
                  </li>
                </ul>
              </section>

              {/* Warranties and Guarantees */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">6.</span> Warranties and Guarantees
                </h2>
                <p className="text-gray-600">
                  Our work is backed by industry-standard warranties:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>
                    <strong>Labor Warranty:</strong> We warrant our workmanship for a
                    period specified in your service agreement (typically 1 year).
                  </li>
                  <li>
                    <strong>Parts Warranty:</strong> Parts and equipment are covered by
                    manufacturer warranties. We can provide warranty documentation upon request.
                  </li>
                  <li>
                    <strong>Satisfaction Guarantee:</strong> If you're not satisfied with
                    our work, please contact us within 7 days to discuss resolution.
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> Warranties do not cover damage from misuse,
                    accidents, or failure to follow maintenance recommendations.
                  </p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-johnson-blue">7.</span> Limitation of Liability
                </h2>
                <p className="text-gray-600">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>
                    Our liability for any claim arising from our services shall not
                    exceed the amount paid for the specific service giving rise to the claim.
                  </li>
                  <li>
                    We are not liable for indirect, incidental, special, consequential,
                    or punitive damages.
                  </li>
                  <li>
                    We are not liable for pre-existing conditions, concealed defects,
                    or damage caused by others.
                  </li>
                  <li>
                    We are not liable for delays or failures caused by circumstances
                    beyond our reasonable control.
                  </li>
                </ul>
              </section>

              {/* Indemnification */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">8.</span> Indemnification
                </h2>
                <p className="text-gray-600">
                  You agree to indemnify and hold harmless Johnson Bros. Plumbing & Drain
                  Cleaning, its officers, employees, and agents from any claims, damages,
                  losses, or expenses arising from:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Your violation of these Terms</li>
                  <li>Your misuse of our services</li>
                  <li>Your violation of any third-party rights</li>
                  <li>False information provided to us</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">9.</span> Intellectual Property
                </h2>
                <p className="text-gray-600">
                  All content on our website, including text, graphics, logos, images,
                  and software, is the property of Johnson Bros. Plumbing & Drain Cleaning
                  or our licensors and is protected by copyright and trademark laws.
                </p>
                <p className="text-gray-600 mt-4">
                  You may not reproduce, distribute, modify, or create derivative works
                  from our content without our express written permission.
                </p>
              </section>

              {/* Dispute Resolution */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">10.</span> Dispute Resolution
                </h2>
                <p className="text-gray-600">
                  We value our customers and will work to resolve any disputes informally.
                  If a dispute cannot be resolved:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>
                    <strong>Mediation:</strong> Both parties agree to attempt mediation
                    before pursuing other remedies.
                  </li>
                  <li>
                    <strong>Small Claims:</strong> Either party may pursue claims in
                    small claims court for disputes within the court's jurisdiction.
                  </li>
                  <li>
                    <strong>Class Action Waiver:</strong> You agree to resolve disputes
                    on an individual basis and waive any right to participate in class actions.
                  </li>
                </ul>
              </section>

              {/* Governing Law */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">11.</span> Governing Law
                </h2>
                <p className="text-gray-600">
                  These Terms shall be governed by and construed in accordance with the
                  laws of the Commonwealth of Massachusetts, without regard to its
                  conflict of law provisions.
                </p>
                <p className="text-gray-600 mt-4">
                  Any legal action arising from these Terms shall be brought in the
                  state or federal courts located in Norfolk County, Massachusetts.
                </p>
              </section>

              {/* Severability */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">12.</span> Severability
                </h2>
                <p className="text-gray-600">
                  If any provision of these Terms is found to be unenforceable or invalid,
                  that provision shall be limited or eliminated to the minimum extent
                  necessary, and the remaining provisions shall remain in full force and effect.
                </p>
              </section>

              {/* Entire Agreement */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">13.</span> Entire Agreement
                </h2>
                <p className="text-gray-600">
                  These Terms, together with our{' '}
                  <Link href="/privacy-policy" className="text-johnson-blue hover:underline">
                    Privacy Policy
                  </Link>
                  , constitute the entire agreement between you and Johnson Bros.
                  Plumbing & Drain Cleaning regarding the use of our services.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <span className="text-johnson-blue">14.</span> Contact Information
                </h2>
                <p className="text-gray-600 mb-6">
                  If you have any questions about these Terms of Service, please contact us:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-johnson-blue" />
                    <span className="text-gray-700">
                      <strong>Email:</strong>{' '}
                      <a
                        href="mailto:sales@thejohnsonbros.com"
                        className="text-johnson-blue hover:underline"
                      >
                        sales@thejohnsonbros.com
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-johnson-blue" />
                    <span className="text-gray-700">
                      <strong>Phone:</strong>{' '}
                      <a
                        href="tel:+16174799911"
                        className="text-johnson-blue hover:underline"
                      >
                        (617) 479-9911
                      </a>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-johnson-blue flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      <strong>Address:</strong><br />
                      Johnson Bros. Plumbing & Drain Cleaning<br />
                      75 East Elm Ave<br />
                      Quincy, MA 02170
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-johnson-blue/5 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    <strong>Business Information:</strong><br />
                    Massachusetts Plumbing License: PL #17034-M<br />
                    Corporate License: #4581<br />
                    Fully Licensed and Insured
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
