import { useQuery } from "@tanstack/react-query";
import { Star, ExternalLink, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface GoogleReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  time: string;
  location: string;
  profilePhoto?: string;
  source: string;
}

interface GoogleReviewsData {
  reviews: GoogleReview[];
  totalReviews: number;
  averageRating: number;
  locations: {
    placeId: string;
    name: string;
    address: string;
  }[];
}

export default function GoogleReviewsSection() {
  const { data: googleData, isLoading, error } = useQuery<GoogleReviewsData>({
    queryKey: ["/api/google-reviews"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return "1 week ago";
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 60) return "1 month ago";
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

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

  if (error) {
    return (
      <section className="py-16 bg-white" data-testid="google-reviews-error">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <p className="text-gray-600">Reviews are temporarily unavailable. Please check back later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-white" data-testid="google-reviews-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              What Our Customers Say
            </h2>
            <div className="flex justify-center space-x-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-6" />
              ))}
            </div>
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!googleData || googleData.reviews.length === 0) {
    return (
      <section className="py-16 bg-white" data-testid="google-reviews-empty">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <p className="text-gray-600">No reviews available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white" data-testid="google-reviews-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with ratings summary */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-6" data-testid="reviews-title">
            Real Google Reviews from Our Customers
          </h2>
          
          {/* Overall rating display */}
          <div className="inline-flex items-center justify-center space-x-4 bg-green-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="flex justify-center space-x-1 mb-2">
                {renderStars(Math.round(googleData.averageRating))}
              </div>
              <div className="text-3xl font-bold text-gray-900" data-testid="average-rating">
                {googleData.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            
            <div className="h-12 w-px bg-gray-300"></div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900" data-testid="total-reviews">
                {googleData.totalReviews.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Google Reviews</div>
            </div>
            
            <div className="h-12 w-px bg-gray-300"></div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {googleData.locations.length}
              </div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
          </div>

          {/* Location badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {googleData.locations.map((location) => (
              <Badge
                key={location.placeId}
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 px-3 py-1"
                data-testid={`location-badge-${location.placeId}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {location.name.replace('Johnson Bros. Plumbing & Drain Cleaning - ', '')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {googleData.reviews.slice(0, 9).map((review) => (
            <Card key={review.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid={`review-${review.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  {review.profilePhoto ? (
                    <img 
                      src={review.profilePhoto} 
                      alt={review.author}
                      className="h-12 w-12 rounded-full object-cover"
                      data-testid={`reviewer-photo-${review.id}`}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {review.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900" data-testid={`reviewer-name-${review.id}`}>
                      {review.author}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-4" data-testid={`review-text-${review.id}`}>
                  {review.text}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span data-testid={`review-time-${review.id}`}>
                      {formatTimeAgo(review.time)}
                    </span>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {review.location.replace('Johnson Bros. Plumbing & Drain Cleaning - ', '')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Experience the Johnson Bros. difference for yourself
          </p>
          <div className="space-x-4">
            <Button size="lg" data-testid="book-service-btn">
              Book Your Service
            </Button>
            <Button variant="outline" size="lg" data-testid="view-more-reviews-btn">
              <ExternalLink className="h-4 w-4 mr-2" />
              View More on Google
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}