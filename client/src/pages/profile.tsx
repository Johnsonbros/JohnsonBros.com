import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Star, 
  ExternalLink, 
  Camera,
  MessageCircle,
  Calendar,
  Award,
  Heart,
  Users,
  Shield
} from "lucide-react";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";

export default function Profile() {
  const businessInfo = {
    name: "Johnson Bros. Plumbing & Drain Cleaning",
    rating: 5.0,
    reviewCount: 20,
    category: "Plumber",
    address: "55 Brighton St, Abington, MA 02351",
    phone: "(617) 686-8763",
    website: "https://thejohnsonbros.com",
    hours: "Open 24 hours",
    coordinates: "43G5+M2 Abington, Massachusetts",
    attributes: [
      { icon: Shield, label: "Identifies as Black-owned", color: "bg-purple-100 text-purple-800" },
      { icon: Heart, label: "LGBTQ+ friendly", color: "bg-pink-100 text-pink-800" },
      { icon: Users, label: "Identifies as women-owned", color: "bg-blue-100 text-blue-800" }
    ]
  };

  const ownerMessage = {
    title: "🚨 Plumbing emergency? Stay calm—we've got your back!",
    content: "When the unexpected happens, Johnson Bros. Plumbing & Drain Cleaning is your trusted ally. We're ready around-the-clock with swift, professional help and clear explanations, so you always know exactly what's happening.",
    features: [
      "⏰ 24/7 Emergency Response",
      "🛠️ Fast, Reliable Solutions", 
      "🤝 Friendly, Transparent Communication"
    ],
    cta: "Emergencies can't wait—and neither should you!",
    date: "May 31, 2025"
  };

  const recentReviews = [
    {
      id: 1,
      author: "Monique Davis",
      rating: 5,
      timeAgo: "4 months ago",
      text: "Johnson Bros. Plumbing & Drain Cleaning are amazing. I have been working with them over the years for general maintenance, repairs and EMERGENCY situations. The team is reliable, fair and honest - I highly recommend them !!",
      response: "Monique, you've been with us through big repairs and late-night emergencies—your loyalty means the world. Thanks for trusting our family business to look after yours. We're always here 24/7 if you need us. – Nate & the team"
    },
    {
      id: 2,
      author: "Crypto Kev",
      rating: 5,
      timeAgo: "6 months ago",
      text: "I recently hired Johnson Brothers Plumbing for a job at my home, and I couldn't be more satisfied with their service. From the initial call to the final fix, they were prompt, professional, and extremely knowledgeable.",
      response: "Thanks Kev for the awesome review! I'm glad we can get there quick and fix your plumbing right away. Any other plumbing issues feel free to call or text us 24/7!"
    },
    {
      id: 3,
      author: "Laurie Cirignano",
      rating: 5,
      timeAgo: "4 months ago",
      text: "Johnson Bros is great! We can always count on Nate and Jhaz. Great work, reasonably priced. I've had old plumbing fixed and/or replaced, new plumbing installed, Installs for disposal, dishwasher and laundry hookups, my go to plumbers!",
      response: "Thank you for the 5-star review, Laurie! We're thrilled to hear that Nate and Jahz provided great work at a reasonable price. If you need plumbing services in Quincy, we're here 24/7. We appreciate your trust in Johnson Bros Plumbing & Drain Cleaning!"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <>
      <SEO
        title="Johnson Bros. Plumbing & Drain Cleaning - Business Profile"
        description="Learn about Johnson Bros. Plumbing & Drain Cleaning. 24/7 emergency service, 5.0 star rating, serving Abington, MA and the South Shore."
        keywords={["Johnson Bros", "plumbing profile", "Abington plumber", "24/7 emergency", "South Shore plumbing"]}
        url="/profile"
        type="website"
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Business Header */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Business Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">JB</span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1" data-testid="business-name">
                        {businessInfo.name}
                      </h1>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {renderStars(businessInfo.rating)}
                        </div>
                        <span className="font-semibold text-lg">{businessInfo.rating}</span>
                        <span className="text-gray-600">({businessInfo.reviewCount})</span>
                        <Badge variant="secondary">{businessInfo.category}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span>{businessInfo.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">{businessInfo.hours}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <a href={`tel:${businessInfo.phone}`} className="hover:text-blue-600 transition-colors">
                        {businessInfo.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <a href={businessInfo.website} className="hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                        thejohnsonbros.com
                      </a>
                    </div>
                  </div>

                  {/* Business Attributes */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {businessInfo.attributes.map((attr, index) => (
                      <Badge key={index} className={`${attr.color} border-0`}>
                        <attr.icon className="h-3 w-3 mr-1" />
                        {attr.label}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(`tel:${businessInfo.phone}`, '_self')}
                      data-testid="call-button"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => window.open('https://www.google.com/maps/place/Johnson+Bros.+Plumbing+%26+Drain+Cleaning/@42.1266539,-70.9450644,17z/data=!3m1!4b1!4m6!3m5!1s0x49fa703971dae33d:0xb7d5974b1007a5f2!8m2!3d42.12665!4d-70.9424895!16s%2Fg%2F11x0_2sp94?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D', '_blank')}
                      data-testid="directions-button"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => window.open(businessInfo.website, '_blank')}
                      data-testid="website-button"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  </div>
                </div>

                {/* Hours Schedule */}
                <div className="lg:w-80">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <div key={day} className="flex justify-between items-center">
                            <span className="text-gray-700">{day}</span>
                            <span className="font-medium text-green-600">Open 24 hours</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Message */}
          <Card className="mb-8 border-l-4 border-l-blue-600">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">From the Owner</span>
              </div>
              <CardTitle className="text-xl">{ownerMessage.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{ownerMessage.content}</p>
              <div className="space-y-2 mb-4">
                {ownerMessage.features.map((feature, index) => (
                  <p key={index} className="text-gray-700 font-medium">{feature}</p>
                ))}
              </div>
              <p className="font-semibold text-gray-900 mb-4">{ownerMessage.cta}</p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button onClick={() => window.open(`tel:617-479-9911`, '_self')}>
                  📞 Call or Text ASAP: 617-479-9911
                </Button>
                <Button variant="outline" onClick={() => window.open(businessInfo.website, '_blank')}>
                  🌐 Visit Website
                </Button>
              </div>
              <p className="text-sm text-gray-500">{ownerMessage.date}</p>
            </CardContent>
          </Card>

          {/* Q&A Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Questions and Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Are free estimates available for plumbing projects in Abington and other South Shore towns?
                  </h4>
                  <div className="flex items-start gap-2 p-4 bg-green-50 rounded-lg">
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      ✓ Verified
                    </Badge>
                    <div>
                      <p className="text-gray-700">
                        Yes, we do free video estimates. We believe in transparency and offer no-obligation estimates so you can decide on the best approach for your home or business. We'll outline costs and timelines to ensure you're always in the loop.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">6 months ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Customer Reviews
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {renderStars(5)}
                </div>
                <span className="text-2xl font-bold">{businessInfo.rating}</span>
                <span className="text-gray-600">{businessInfo.reviewCount} reviews</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="font-medium text-gray-600">
                          {review.author.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{review.author}</h4>
                          <span className="text-sm text-gray-500">{review.timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-gray-700 mb-3">{review.text}</p>
                        {review.response && (
                          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-600">
                            <p className="text-sm font-medium text-blue-800 mb-1">Response from the owner</p>
                            <p className="text-sm text-gray-700">{review.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://www.google.com/maps/place/Johnson+Bros.+Plumbing+%26+Drain+Cleaning/@42.1266539,-70.9450644,17z/data=!3m1!4b1!4m6!3m5!1s0x49fa703971dae33d:0xb7d5974b1007a5f2!8m2!3d42.12665!4d-70.9424895!16s%2Fg%2F11x0_2sp94?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Reviews on Google
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Experience Our 5-Star Service?</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Join our hundreds of satisfied customers across the South Shore
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => window.open(`tel:${businessInfo.phone}`, '_self')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call {businessInfo.phone}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-700"
                  onClick={() => window.open(businessInfo.website, '_blank')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Online
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}