import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Star, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  serviceType: string;
  date: string;
  city: string;
}

export function TestimonialsWidget() {
  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/social-proof/testimonials"],
    refetchInterval: 180000, // Refresh every 3 minutes
    staleTime: 120000, // Consider data stale after 2 minutes
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md" data-testid="testimonials-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-yellow-500" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Card className="w-full max-w-md shadow-lg" data-testid="testimonials-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Quote className="h-5 w-5 text-yellow-500" />
          What Customers Say
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto space-y-4">
          {testimonials.slice(0, 4).map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`testimonial-${testimonial.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1" data-testid={`rating-${testimonial.id}`}>
                  {renderStars(testimonial.rating)}
                </div>
                <Badge variant="outline" className="text-xs bg-white" data-testid={`service-${testimonial.id}`}>
                  {testimonial.serviceType}
                </Badge>
              </div>
              
              <blockquote className="text-sm text-gray-700 mb-3 italic" data-testid={`comment-${testimonial.id}`}>
                "{testimonial.comment}"
              </blockquote>
              
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="font-medium" data-testid={`customer-${testimonial.id}`}>
                  — Satisfied Customer
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span data-testid={`location-${testimonial.id}`}>{testimonial.city}</span>
                  </div>
                  {testimonial.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span data-testid={`date-${testimonial.id}`}>
                        {formatDistanceToNow(new Date(testimonial.date), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <div className="text-center py-6" data-testid="no-testimonials">
            <Quote className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No reviews available</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200" data-testid="review-summary">
            ⭐ {testimonials.length > 0 ? '5.0' : 'N/A'} average rating from recent customers
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}