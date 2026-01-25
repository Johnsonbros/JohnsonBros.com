import { CheckCircle, Clock, DollarSign, Shield, Star, Users, Award, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface WhyChooseUsProps {
  serviceName?: string;
  showTestimonials?: boolean;
  showJobsCounter?: boolean;
}

interface ServiceTestimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

// Service-specific testimonials
const serviceTestimonials: Record<string, ServiceTestimonial[]> = {
  'emergency-plumbing': [
    {
      id: '1',
      name: 'Sarah M.',
      location: 'Quincy, MA',
      rating: 5,
      comment: 'Burst pipe at 2 AM and they were here within an hour. Saved our basement!',
      date: '2 weeks ago',
      service: 'Emergency Pipe Repair'
    },
    {
      id: '2',
      name: 'Mike R.',
      location: 'Weymouth, MA',
      rating: 5,
      comment: 'Fast response, professional service. Fixed our flooding issue immediately.',
      date: '1 month ago',
      service: 'Emergency Water Shutoff'
    }
  ],
  'drain-cleaning': [
    {
      id: '3',
      name: 'Jennifer K.',
      location: 'Braintree, MA',
      rating: 5,
      comment: 'They cleared our main drain when others couldn\'t. Very knowledgeable!',
      date: '3 weeks ago',
      service: 'Main Drain Cleaning'
    },
    {
      id: '4',
      name: 'David L.',
      location: 'Hingham, MA',
      rating: 5,
      comment: 'Fixed our slow drains same day. Great service and fair pricing.',
      date: '1 week ago',
      service: 'Kitchen Drain Service'
    }
  ],
  'water-heater': [
    {
      id: '5',
      name: 'Patricia H.',
      location: 'Plymouth, MA',
      rating: 5,
      comment: 'New water heater installed perfectly. Hot water is amazing now!',
      date: '2 weeks ago',
      service: 'Water Heater Installation'
    },
    {
      id: '6',
      name: 'Robert T.',
      location: 'Marshfield, MA',
      rating: 5,
      comment: 'Repaired our tankless heater quickly. Very professional team.',
      date: '1 month ago',
      service: 'Tankless Heater Repair'
    }
  ],
  'pipe-repair': [
    {
      id: '7',
      name: 'Linda S.',
      location: 'Quincy, MA',
      rating: 5,
      comment: 'Found and fixed a hidden leak. Saved us from major damage!',
      date: '3 days ago',
      service: 'Leak Detection & Repair'
    },
    {
      id: '8',
      name: 'James W.',
      location: 'Abington, MA',
      rating: 5,
      comment: 'Replaced old pipes efficiently. Clean work and great communication.',
      date: '2 weeks ago',
      service: 'Pipe Replacement'
    }
  ],
  'gas-heat': [
    {
      id: '9',
      name: 'Nancy P.',
      location: 'Weymouth, MA',
      rating: 5,
      comment: 'Gas line installation was perfect. Feel safe with their work.',
      date: '1 week ago',
      service: 'Gas Line Installation'
    },
    {
      id: '10',
      name: 'Tom B.',
      location: 'Quincy, MA',
      rating: 5,
      comment: 'Fixed our heating system quickly. House is warm again!',
      date: '1 month ago',
      service: 'Heating System Repair'
    }
  ],
  'general': [
    {
      id: '11',
      name: 'Mary D.',
      location: 'Quincy, MA',
      rating: 5,
      comment: 'Always reliable and professional. Our go-to plumbers for years!',
      date: '1 week ago',
      service: 'General Plumbing'
    },
    {
      id: '12',
      name: 'John K.',
      location: 'Braintree, MA',
      rating: 5,
      comment: 'Excellent service every time. Honest pricing and quality work.',
      date: '2 weeks ago',
      service: 'Fixture Installation'
    }
  ]
};

export function WhyChooseUs({
  serviceName = 'general',
  showTestimonials = true,
  showJobsCounter = true
}: WhyChooseUsProps) {
  const [jobsThisMonth, setJobsThisMonth] = useState(287);

  // Fetch actual job count if available
  const { data: jobStats } = useQuery<{ count: number }>({
    queryKey: ['/api/v1/stats/jobs-this-month'],
    enabled: showJobsCounter
  });

  // Animate the jobs counter
  useEffect(() => {
    if (showJobsCounter) {
      const targetJobs = jobStats?.count || 287;
      const increment = targetJobs > jobsThisMonth ? 1 : -1;
      const timer = setInterval(() => {
        setJobsThisMonth(prev => {
          if ((increment > 0 && prev >= targetJobs) || (increment < 0 && prev <= targetJobs)) {
            clearInterval(timer);
            return targetJobs;
          }
          return prev + increment * Math.ceil(Math.abs(targetJobs - prev) / 20);
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [jobStats, showJobsCounter]);

  const reasons = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "15+ Years Experience",
      description: "Family-owned since 2008, serving Massachusetts families with pride"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Licensed & Insured",
      description: "MA License #PC1673, fully insured with $2M liability coverage"
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Upfront Pricing",
      description: "No hidden fees - price approved before work begins"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Satisfaction Guarantee",
      description: "100% satisfaction or we'll make it right - guaranteed"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Technicians",
      description: "All technicians are licensed, trained, and background-checked"
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      title: "1-Year Warranty",
      description: "Complete warranty on labor and manufacturer warranty on parts"
    }
  ];

  const testimonials = serviceTestimonials[serviceName] || serviceTestimonials['general'];

  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header with Jobs Counter */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-johnson-orange text-white text-sm px-4 py-2">
            TRUSTED BY YOUR NEIGHBORS
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Johnson Bros?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            With over 27 years of experience, we've built our reputation on quality work,
            honest pricing, and treating every home like our own.
          </p>

          {/* Jobs Completed Counter */}
          {showJobsCounter && (
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-johnson-orange" />
                <span className="text-2xl font-bold text-johnson-blue">{jobsThisMonth}</span>
                <span className="text-gray-600">Jobs Completed This Month</span>
              </div>
            </div>
          )}
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reasons.map((reason, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-johnson-orange bg-orange-50 p-3 rounded-lg">
                    {reason.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{reason.title}</h3>
                    <p className="text-sm text-gray-600">{reason.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Service-Specific Testimonials */}
        {showTestimonials && testimonials.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              What Our Customers Say
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="bg-white hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {testimonial.service}
                      </Badge>
                    </div>
                    <p className="text-gray-700 italic mb-3">"{testimonial.comment}"</p>
                    <p className="text-xs text-gray-500">{testimonial.date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center bg-gradient-to-r from-johnson-orange/10 to-johnson-blue/10 rounded-xl p-8 border border-johnson-orange/20">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Experience the Johnson Bros Difference?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of satisfied customers who trust us with their plumbing needs.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Free Estimates</span>
            <span className="text-gray-400">•</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Same-Day Service</span>
            <span className="text-gray-400">•</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>24/7 Emergency</span>
          </div>
        </div>
      </div>
    </section>
  );
}