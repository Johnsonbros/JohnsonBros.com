/**
 * Privacy Policy Page
 *
 * GDPR/CCPA compliant privacy policy for Johnson Bros. Plumbing.
 */

import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Shield, Mail, Phone, MapPin, Cookie, Database, Lock, Eye, Trash2, Download } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 24, 2026';

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Johnson Bros. Plumbing & Drain Cleaning</title>
        <meta
          name="description"
          content="Learn how Johnson Bros. Plumbing protects your privacy and handles your personal data in compliance with GDPR and CCPA."
        />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-johnson-blue/10 rounded-full mb-6">
                <Shield className="w-8 h-8 text-johnson-blue" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-600">
                Your privacy is important to us. This policy explains how we collect,
                use, and protect your personal information.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Last Updated: {lastUpdated}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-gray">
              {/* Introduction */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">1.</span> Introduction
                </h2>
                <p className="text-gray-600">
                  Johnson Bros. Plumbing & Drain Cleaning ("we", "us", or "our") is committed
                  to protecting your privacy. This Privacy Policy explains how we collect,
                  use, disclose, and safeguard your information when you visit our website
                  or use our services.
                </p>
                <p className="text-gray-600">
                  By using our services, you agree to the collection and use of information
                  in accordance with this policy. If you do not agree with the terms of this
                  policy, please do not access our website or use our services.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6 text-johnson-blue" />
                  <span className="text-johnson-blue">2.</span> Information We Collect
                </h2>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Personal Information
                </h3>
                <p className="text-gray-600">
                  We may collect personally identifiable information that you voluntarily
                  provide when you:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Request a quote or schedule a service</li>
                  <li>Contact us via phone, email, or chat</li>
                  <li>Create an account on our website</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Participate in promotions or surveys</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  This information may include:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Name and contact information (email, phone number, address)</li>
                  <li>Service history and preferences</li>
                  <li>Payment information (processed securely by third-party providers)</li>
                  <li>Communication records (chat logs, emails, call recordings)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Automatically Collected Information
                </h3>
                <p className="text-gray-600">
                  When you visit our website, we may automatically collect certain information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and approximate location</li>
                  <li>Pages visited and time spent on site</li>
                  <li>Referring website or search terms</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-johnson-blue" />
                  <span className="text-johnson-blue">3.</span> How We Use Your Information
                </h2>
                <p className="text-gray-600">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Provide, maintain, and improve our plumbing services</li>
                  <li>Process your service requests and transactions</li>
                  <li>Communicate with you about appointments, updates, and promotions</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Send appointment reminders and service notifications</li>
                  <li>Analyze website usage to improve user experience</li>
                  <li>Detect and prevent fraud or security issues</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">4.</span> Information Sharing
                </h2>
                <p className="text-gray-600">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>
                    <strong>Service Providers:</strong> Third parties that help us operate
                    our business (scheduling software, payment processors, communication platforms)
                  </li>
                  <li>
                    <strong>Business Partners:</strong> Companies we partner with to provide
                    services (subject to confidentiality agreements)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or to protect
                    our rights and safety
                  </li>
                </ul>
                <p className="text-gray-600 mt-4">
                  Our service providers include:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>HousecallPro (scheduling and dispatch)</li>
                  <li>Twilio (SMS and phone communications)</li>
                  <li>Google Analytics (website analytics)</li>
                  <li>OpenAI (AI-powered chat assistance)</li>
                </ul>
              </section>

              {/* Cookies and Tracking */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Cookie className="w-6 h-6 text-johnson-blue" />
                  <span className="text-johnson-blue">5.</span> Cookies and Tracking
                </h2>
                <p className="text-gray-600">
                  We use cookies and similar tracking technologies to collect information
                  about your browsing activities. You can manage your cookie preferences
                  at any time.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Types of Cookies We Use
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>
                    <strong>Necessary Cookies:</strong> Essential for website functionality
                    (session management, security, preferences)
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand how visitors
                    interact with our website
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> Used to deliver relevant
                    advertisements and measure campaign effectiveness
                  </li>
                </ul>

                <div className="mt-4 p-4 bg-johnson-blue/5 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    You can manage your cookie preferences by clicking the "Cookie Preferences"
                    link in our website footer or by adjusting your browser settings.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-johnson-blue" />
                  <span className="text-johnson-blue">6.</span> Your Rights
                </h2>
                <p className="text-gray-600">
                  Depending on your location, you may have the following rights regarding
                  your personal data:
                </p>

                <div className="grid gap-4 mt-6">
                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                    <Eye className="w-5 h-5 text-johnson-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Access</h4>
                      <p className="text-sm text-gray-600">
                        Request a copy of the personal data we hold about you.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                    <Download className="w-5 h-5 text-johnson-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Portability</h4>
                      <p className="text-sm text-gray-600">
                        Request your data in a machine-readable format.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                    <Trash2 className="w-5 h-5 text-johnson-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Deletion</h4>
                      <p className="text-sm text-gray-600">
                        Request that we delete your personal data (subject to legal requirements).
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mt-6">
                  To exercise these rights, please contact us using the information below
                  or visit your account settings if you have an account with us.
                </p>
              </section>

              {/* Data Security */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">7.</span> Data Security
                </h2>
                <p className="text-gray-600">
                  We implement appropriate technical and organizational measures to protect
                  your personal information, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security assessments and monitoring</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  While we strive to protect your information, no method of transmission
                  over the Internet is 100% secure. We cannot guarantee absolute security.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">8.</span> Data Retention
                </h2>
                <p className="text-gray-600">
                  We retain your personal data only for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  Generally, we retain service records for up to 7 years for warranty
                  and legal purposes. Marketing data is retained for 2 years after your
                  last interaction unless you opt out sooner.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">9.</span> Children's Privacy
                </h2>
                <p className="text-gray-600">
                  Our services are not directed to individuals under 18 years of age.
                  We do not knowingly collect personal information from children. If you
                  believe we have collected information from a minor, please contact us
                  immediately.
                </p>
              </section>

              {/* Changes to This Policy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">10.</span> Changes to This Policy
                </h2>
                <p className="text-gray-600">
                  We may update this Privacy Policy from time to time. We will notify you
                  of any changes by posting the new policy on this page and updating the
                  "Last Updated" date. We encourage you to review this policy periodically.
                </p>
              </section>

              {/* Contact Us */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-johnson-blue">11.</span> Contact Us
                </h2>
                <p className="text-gray-600 mb-6">
                  If you have questions about this Privacy Policy or wish to exercise
                  your privacy rights, please contact us:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-johnson-blue" />
                    <span className="text-gray-700">
                      <strong>Email:</strong>{' '}
                      <a
                        href="mailto:privacy@thejohnsonbros.com"
                        className="text-johnson-blue hover:underline"
                      >
                        privacy@thejohnsonbros.com
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
              </section>

              {/* Quick Actions */}
              <section className="mt-12 p-6 bg-johnson-blue/5 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Manage Your Privacy
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Link href="/customer-portal">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export My Data
                    </Button>
                  </Link>
                  <Link href="/customer-portal">
                    <Button variant="outline">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Data
                    </Button>
                  </Link>
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
