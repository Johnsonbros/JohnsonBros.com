import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone, CheckCircle, Clock, Star, Award, Shield, Wrench, Droplet, Thermometer, AlertCircle } from "lucide-react";
import emergencyImg from '@assets/emergency.jpg';
import cleanFaucetImg from '@assets/plumbing.jpg';

const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  unitNumber: z.string().optional(),
  serviceType: z.string().optional(),
  message: z.string().optional(),
  landingPage: z.string().optional(),
  campaignName: z.string().optional(),
  campaignSource: z.string().optional(),
  campaignMedium: z.string().optional(),
  gclid: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  referrer: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

export default function GablesCondoLanding() {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      unitNumber: "",
      serviceType: "",
      message: "",
      landingPage: "gables-condo-landing",
      campaignName: "gables-condo-google-ads",
      campaignSource: "google",
      campaignMedium: "cpc",
      gclid: new URLSearchParams(window.location.search).get("gclid") || "",
      utmSource: new URLSearchParams(window.location.search).get("utm_source") || "",
      utmMedium: new URLSearchParams(window.location.search).get("utm_medium") || "",
      utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
      utmTerm: new URLSearchParams(window.location.search).get("utm_term") || "",
      utmContent: new URLSearchParams(window.location.search).get("utm_content") || "",
      referrer: document.referrer || "",
    },
  });

  const submitLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Convert empty strings to undefined to match backend schema
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
      );
      
      return await apiRequest("POST", "/api/lead", cleanData);
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast({
        title: "Success!",
        description: "We'll contact you shortly to schedule your service.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please call us directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    submitLeadMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Professional Plumbing Services for Gables Condominium Trust | Johnson Bros. Plumbing</title>
        <meta 
          name="description" 
          content="Expert plumbing services for Gables Condominium Trust in Abington, MA. 10% off for all Gables residents. Licensed, insured, and family-owned since 2008. Call 617-479-9911 for same-day service." 
        />
        <meta name="keywords" content="plumber Abington MA, Gables condo plumbing, emergency plumber South Shore, drain cleaning Abington, water heater repair" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Professional Plumbing for Gables Condominium Trust - Johnson Bros." />
        <meta property="og:description" content="10% off plumbing services for Gables residents. Family-owned, licensed & insured. Same-day service available." />
        <meta property="og:url" content="https://johnsonbrosplumbing.com/landing/gables-condo" />
        
        {/* Schema.org Local Business Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Plumber",
            "name": "Johnson Bros. Plumbing & Drain Cleaning",
            "image": "https://johnsonbrosplumbing.com/logo.png",
            "telephone": "617-479-9911",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Quincy",
              "addressRegion": "MA",
              "postalCode": "02169",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 42.2529,
              "longitude": -71.0023
            },
            "url": "https://johnsonbrosplumbing.com",
            "priceRange": "$$",
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              "opens": "00:00",
              "closes": "23:59"
            },
            "areaServed": [
              {
                "@type": "City",
                "name": "Abington"
              },
              {
                "@type": "City",
                "name": "Quincy"
              },
              {
                "@type": "City",
                "name": "Braintree"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  SPECIAL OFFER FOR GABLES RESIDENTS
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  There When It Matters Most
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-6">
                  Trusted Plumbing & Drain Experts for Gables Condominium Trust
                </p>
                <p className="text-lg text-blue-200 mb-8">
                  Johnson Bros. Plumbing & Drain Cleaning has you covered 24/7 in Abington, Quincy, and Greater South Shore.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <a 
                    href="tel:617-479-9911" 
                    className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
                    data-testid="button-call-hero"
                  >
                    <Phone className="w-5 h-5" />
                    Call 617-479-9911
                  </a>
                  <a 
                    href="#schedule" 
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                    data-testid="button-schedule-hero"
                  >
                    Schedule Service Now
                  </a>
                </div>

                <div className="flex items-center gap-4 text-sm text-blue-200">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">4.9/5 Rating</span>
                  </div>
                  <span>•</span>
                  <span>Licensed & Insured</span>
                  <span>•</span>
                  <span>Family-Owned Since 2008</span>
                </div>
              </div>

              {/* Quick Contact Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-gray-900 dark:text-white">
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Get 10% Off Your Service</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Exclusive offer for Gables Condominium Trust residents. Fill out the form and we'll contact you within 1 hour.
                </p>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="John Smith" 
                              className="bg-gray-50 dark:bg-gray-700"
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel" 
                              placeholder="(617) 555-0123" 
                              className="bg-gray-50 dark:bg-gray-700"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="john@example.com" 
                              className="bg-gray-50 dark:bg-gray-700"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Unit 123" 
                              className="bg-gray-50 dark:bg-gray-700"
                              data-testid="input-unit"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Needed</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-50 dark:bg-gray-700" data-testid="select-service">
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="drain-cleaning">Drain Cleaning</SelectItem>
                              <SelectItem value="water-heater">Water Heater Repair/Installation</SelectItem>
                              <SelectItem value="leak-repair">Leak Detection & Repair</SelectItem>
                              <SelectItem value="emergency">Emergency Plumbing</SelectItem>
                              <SelectItem value="general">General Plumbing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tell us about your issue (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe your plumbing issue..." 
                              className="bg-gray-50 dark:bg-gray-700 min-h-[80px]"
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold"
                      disabled={submitLeadMutation.isPending}
                      data-testid="button-submit-form"
                    >
                      {submitLeadMutation.isPending ? "Submitting..." : "Get My 10% Discount"}
                    </Button>

                    {showSuccess && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3" data-testid="success-message">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-100">Thank you!</p>
                          <p className="text-sm text-green-800 dark:text-green-200">We'll contact you within 1 hour to schedule your service.</p>
                        </div>
                      </div>
                    )}
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Johnson Bros */}
        <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              Why Choose Johnson Bros. Plumbing?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-md text-center" data-testid="feature-fast">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Fast & Reliable</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Same-day service available. We understand that plumbing emergencies can't wait. Our team responds quickly to minimize damage and inconvenience.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-md text-center" data-testid="feature-local">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Family-Owned & Local</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Serving the South Shore community since 2008. We treat every home like our own and build lasting relationships with our customers.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-md text-center" data-testid="feature-quality">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Top-Quality Workmanship</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Licensed and insured technicians with satisfaction guarantee. Every job is done right the first time with quality parts and expert care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Work Showcase */}
        <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Professional Plumbing Services You Can Trust
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={emergencyImg} 
                  alt="Professional emergency water heater repair service" 
                  className="w-full h-80 object-cover"
                  data-testid="img-emergency-service"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-semibold text-lg">24/7 Emergency Plumbing Service</p>
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={cleanFaucetImg} 
                  alt="Quality faucet installation and plumbing fixtures" 
                  className="w-full h-80 object-cover"
                  data-testid="img-quality-work"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-semibold text-lg">Expert Fixture Installation & Repairs</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 md:py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Our Plumbing Services for Gables Residents
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              From routine maintenance to emergency repairs, we handle all your plumbing needs with expertise and care.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="service-drain">
                <Droplet className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Drain Cleaning</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Professional drain cleaning to clear clogs and restore proper water flow throughout your condo unit.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="service-water-heater">
                <Thermometer className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Water Heater Service</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Installation, repair, and maintenance of traditional and tankless water heaters for reliable hot water.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="service-leak">
                <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Leak Detection & Repair</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Advanced leak detection technology and expert repairs to prevent water damage and save on water bills.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="service-general">
                <Wrench className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">General Plumbing</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Fixture installation, pipe repairs, and all your general plumbing needs for condo living.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Special Offer CTA */}
        <section id="schedule" className="py-16 md:py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gables Condominium Trust Residents Save 10%
            </h2>
            <p className="text-xl mb-8 text-orange-100">
              Book this month and receive 10% off any plumbing service. Professional service you can trust at a price that respects your budget.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:617-479-9911" 
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
                data-testid="button-call-cta"
              >
                <Phone className="w-5 h-5" />
                Call Now: 617-479-9911
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                data-testid="button-form-cta"
              >
                Fill Out the Form Above
              </a>
            </div>
          </div>
        </section>

        {/* About Us */}
        <section className="py-16 md:py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Meet Johnson Bros. Plumbing
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed mb-4">
                Johnson Bros. Plumbing & Drain Cleaning is a family-owned and operated business proudly serving Abington, Quincy, and the Greater South Shore since 2008. Founded by brothers Nate and Nick Johnson, our company delivers plumbing excellence you can trust.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                We built our reputation on three core values: <strong>integrity</strong>, <strong>innovation</strong>, and <strong>excellence</strong>. Every member of our team shares these values and brings them to every job, whether it's a routine drain cleaning or an emergency repair at 2 AM.
              </p>
              <p className="text-lg leading-relaxed">
                When you choose Johnson Bros., you're not just hiring a plumber—you're gaining a trusted partner who cares about your home and your peace of mind.
              </p>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              What Our Customers Say
            </h2>
            <div className="flex items-center justify-center gap-2 mb-12">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">4.9 out of 5 stars</span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md" data-testid="review-1">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "Johnson Bros. came out same day when our kitchen sink backed up. Professional, courteous, and solved the problem quickly. Highly recommend!"
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">— Sarah M., Abington</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md" data-testid="review-2">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "Fair pricing, excellent work, and they cleaned up everything when they were done. These guys really know their stuff."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">— Michael T., Quincy</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md" data-testid="review-3">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "Had an emergency leak at 11 PM. They answered the phone and had someone here within an hour. Saved us from major water damage!"
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">— Jennifer K., Braintree</p>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-3" data-testid="badge-google">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Google Guaranteed</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified Professional</p>
                </div>
              </div>

              <div className="flex items-center gap-3" data-testid="badge-bbb">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">BBB Accredited</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">A+ Rating</p>
                </div>
              </div>

              <div className="flex items-center gap-3" data-testid="badge-licensed">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                  <Shield className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Licensed & Insured</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Coverage</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA & Contact */}
        <section className="py-16 md:py-20 bg-blue-900 dark:bg-blue-950 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-2 text-blue-100">
              Call us now or fill out the form at the top of the page
            </p>
            <p className="text-lg mb-8 text-blue-200">
              24/7 Emergency Service • Licensed & Insured • Same-Day Appointments Available
            </p>
            
            <a 
              href="tel:617-479-9911" 
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-lg text-2xl font-bold transition-colors shadow-lg mb-8"
              data-testid="button-call-footer"
            >
              <Phone className="w-6 h-6" />
              617-479-9911
            </a>

            <div className="border-t border-blue-700 pt-8 mt-8">
              <p className="text-blue-200 mb-2">Proudly Serving Our Community Since 2008</p>
              <p className="text-sm text-blue-300">
                Service Areas: Quincy • Abington • Braintree • Weymouth • Plymouth • Marshfield • Hingham • Greater South Shore
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 dark:bg-black text-gray-400 py-8">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Johnson Bros. Plumbing & Drain Cleaning. All rights reserved.
            </p>
            <p className="text-sm mt-2">
              Licensed Plumber • Fully Insured • Family-Owned & Operated
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
