import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, MapPin, CheckCircle, Volume2, Quote } from "lucide-react";
import { motion, HTMLMotionProps } from "framer-motion";

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;

interface VideoTestimonial {
  id: number;
  customerName: string;
  location: string;
  serviceType: string;
  rating: number;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  quote: string;
  date: string;
}

const videoTestimonials: VideoTestimonial[] = [
  {
    id: 1,
    customerName: "David & Sarah Mitchell",
    location: "Brookline, MA",
    serviceType: "Emergency Plumbing",
    rating: 5,
    videoUrl: "#",
    thumbnailUrl: "/api/placeholder/400/225",
    duration: "2:15",
    quote: "They saved our home from flooding at 2 AM. Incredible response time!",
    date: "1 week ago"
  },
  {
    id: 2,
    customerName: "Jennifer Rodriguez",
    location: "Cambridge, MA",
    serviceType: "Bathroom Remodel",
    rating: 5,
    videoUrl: "#",
    thumbnailUrl: "/api/placeholder/400/225",
    duration: "1:45",
    quote: "Professional team transformed our bathroom beyond expectations.",
    date: "2 weeks ago"
  },
  {
    id: 3,
    customerName: "Robert Thompson",
    location: "Newton, MA",
    serviceType: "Water Heater Installation",
    rating: 5,
    videoUrl: "#",
    thumbnailUrl: "/api/placeholder/400/225",
    duration: "1:30",
    quote: "Fair pricing, excellent work, and they cleaned up perfectly.",
    date: "3 weeks ago"
  },
  {
    id: 4,
    customerName: "Maria Chen",
    location: "Somerville, MA",
    serviceType: "Drain Cleaning",
    rating: 5,
    videoUrl: "#",
    thumbnailUrl: "/api/placeholder/400/225",
    duration: "2:00",
    quote: "Fixed a problem three other plumbers couldn't solve!",
    date: "1 month ago"
  }
];

export default function VideoTestimonials() {
  const [selectedVideo, setSelectedVideo] = useState<VideoTestimonial | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = (testimonial: VideoTestimonial) => {
    setSelectedVideo(testimonial);
    setIsPlaying(true);
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4" variant="secondary">
            <Volume2 className="h-3 w-3 mr-1" />
            Video Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Hear From Our Happy Customers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories from real customers throughout Greater Boston
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videoTestimonials.map((testimonial, index) => (
            <MotionDiv
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={testimonial.thumbnailUrl}
                    alt={`${testimonial.customerName} testimonial`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Button
                      onClick={() => handlePlayVideo(testimonial)}
                      className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-primary shadow-lg"
                      size="icon"
                      data-testid={`button-play-video-${testimonial.id}`}
                    >
                      <Play className="h-8 w-8 ml-1" />
                    </Button>
                  </div>

                  {/* Duration Badge */}
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    {testimonial.duration}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  {/* Customer Info */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {testimonial.customerName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{testimonial.location}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      {testimonial.date}
                    </span>
                  </div>

                  {/* Service Type */}
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {testimonial.serviceType}
                  </Badge>

                  {/* Quote */}
                  <div className="relative">
                    <Quote className="absolute -top-1 -left-1 h-4 w-4 text-gray-300" />
                    <p className="text-sm text-gray-700 italic pl-4">
                      {testimonial.quote}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          ))}
        </div>

        {/* Video Modal Placeholder */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedVideo(null);
              setIsPlaying(false);
            }}
          >
            <Card className="max-w-4xl w-full">
              <CardContent className="p-6">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg mb-2">Video Player Placeholder</p>
                    <p className="text-sm text-gray-400">
                      {selectedVideo.customerName} - {selectedVideo.serviceType}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {selectedVideo.customerName}
                  </h3>
                  <p className="text-gray-600">{selectedVideo.quote}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedVideo.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {selectedVideo.serviceType}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Stats */}
        <div className="mt-12 bg-primary/5 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-gray-600">Video Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-gray-600">Verified Customers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">27+</div>
              <div className="text-sm text-gray-600">Years Trusted</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Want to share your experience? We'd love to hear from you!
          </p>
          <Button size="lg" variant="outline">
            Leave a Review
          </Button>
        </div>
      </div>
    </section>
  );
}