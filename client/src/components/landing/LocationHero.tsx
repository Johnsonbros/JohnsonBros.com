import { MapPin, Users, Star, TrendingUp, Home, ArrowRight, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LocationHeroProps {
  onBookService: () => void;
  location: string;
  headline?: string;
  subheadline?: string;
  stats?: {
    jobsCompleted: number;
    avgResponseTime: string;
    customerRating: number;
    yearsServing: number;
  };
  testimonials?: Array<{
    name: string;
    location: string;
    rating: number;
    text: string;
    image?: string;
  }>;
  mapImage?: string;
}

export function LocationHero({
  onBookService,
  location = "Quincy, MA",
  headline,
  subheadline,
  stats = {
    jobsCompleted: 1247,
    avgResponseTime: "30 min",
    customerRating: 4.9,
    yearsServing: 15
  },
  testimonials = [
    {
      name: "Sarah Johnson",
      location: "North Quincy",
      rating: 5,
      text: "Fast response, professional service. Fixed our emergency leak in under an hour!",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      name: "Mike Chen",
      location: "Quincy Center",
      rating: 5,
      text: "Best plumber in the area. Fair prices and excellent work. Highly recommend!",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike"
    }
  ],
  mapImage = "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000"
}: LocationHeroProps) {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      {/* Map Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5 bg-cover bg-center"
        style={{ backgroundImage: `url(${mapImage})` }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Location Badge */}
            <Badge className="bg-johnson-blue text-white mb-4 px-4 py-2 text-sm font-bold inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              SERVING {location.toUpperCase()}
            </Badge>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 leading-tight">
              {headline || `Your Trusted Local Plumber in ${location}`}
              <span className="block text-johnson-orange text-2xl sm:text-3xl mt-2">
                Serving Your Neighborhood Since {new Date().getFullYear() - stats.yearsServing}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl mb-6 text-gray-600">
              {subheadline || `Fast, reliable plumbing services for homes and businesses throughout ${location} and surrounding areas.`}
            </p>

            {/* Local Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className="p-3 text-center bg-white shadow-lg">
                <Home className="h-6 w-6 text-johnson-blue mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{stats.jobsCompleted.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Local Jobs</div>
              </Card>
              <Card className="p-3 text-center bg-white shadow-lg">
                <Clock className="h-6 w-6 text-johnson-orange mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}</div>
                <div className="text-xs text-gray-600">Avg Response</div>
              </Card>
              <Card className="p-3 text-center bg-white shadow-lg">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{stats.customerRating}</div>
                <div className="text-xs text-gray-600">Rating</div>
              </Card>
              <Card className="p-3 text-center bg-white shadow-lg">
                <Shield className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{stats.yearsServing}yr</div>
                <div className="text-xs text-gray-600">Experience</div>
              </Card>
            </div>

            {/* Local Testimonials */}
            <Card className="bg-white p-6 mb-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-johnson-blue" />
                What Your Neighbors Say
              </h3>
              <div className="space-y-4">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="flex gap-3 pb-4 border-b last:border-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-gray-900">{testimonial.name}</span>
                          <span className="text-xs text-gray-500 ml-2">• {testimonial.location}</span>
                        </div>
                        <div className="flex items-center">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{testimonial.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Service Areas */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 font-medium mb-2">
                <MapPin className="h-4 w-4 inline mr-1 text-johnson-blue" />
                Also serving nearby areas:
              </p>
              <p className="text-sm text-gray-600">
                Braintree • Weymouth • Milton • Dorchester • South Boston • Randolph • Holbrook
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onBookService}
                size="lg"
                className="bg-johnson-blue text-white hover:bg-blue-700 font-bold text-lg px-8 py-6 shadow-xl transform hover:scale-105 transition-all duration-200"
                data-testid="location-book-now"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Book Local Service
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <a
                href="tel:6174799911"
                className="flex items-center justify-center gap-2 bg-johnson-orange text-white hover:bg-orange-600 font-bold text-lg px-8 py-6 rounded-lg shadow-xl transform hover:scale-105 transition-all duration-200"
                data-testid="location-call-now"
              >
                Call Your Local Team
              </a>
            </div>
          </div>

          {/* Right Column - Map and Local Presence */}
          <div className="relative">
            {/* Map Container */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <img
                src={mapImage}
                alt={`${location} service area map`}
                className="w-full h-[400px] object-cover"
              />
              
              {/* Service Area Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-johnson-blue/80 via-transparent to-transparent" />
              
              {/* Map Pins Animation */}
              <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-pulse"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  >
                    <div className="relative">
                      <MapPin className="h-6 w-6 text-red-500 drop-shadow-lg" />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Service Coverage Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Full Coverage in {location}</p>
                    <p className="text-xs text-gray-600">Emergency service available 24/7</p>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                    ACTIVE
                  </Badge>
                </div>
              </div>
            </div>

            {/* Local Achievements */}
            <Card className="mt-4 p-4 bg-white shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Local Impact
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-johnson-blue">{Math.floor(stats.jobsCompleted / 12)}</div>
                  <div className="text-xs text-gray-600">Monthly Jobs</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-green-600">98%</div>
                  <div className="text-xs text-gray-600">Same-Day Service</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-johnson-orange">5</div>
                  <div className="text-xs text-gray-600">Local Technicians</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-purple-600">A+</div>
                  <div className="text-xs text-gray-600">BBB Rating</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}