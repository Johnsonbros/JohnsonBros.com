import { useQuery } from "@tanstack/react-query";
import { getReviews } from "@/lib/housecallApi";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsSection() {
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ["/api/v1/reviews"],
    queryFn: getReviews,
  });

  const averageRating = reviews?.length 
    ? (reviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / reviews.length).toFixed(1)
    : "4.8";

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return "1 week ago";
    if (diffInDays < 21) return "2 weeks ago";
    if (diffInDays < 28) return "3 weeks ago";
    if (diffInDays < 60) return "1 month ago";
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <section id="reviews" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex text-yellow-400 text-xl sm:text-2xl">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span className="text-lg sm:text-xl font-bold text-gray-900" data-testid="average-rating">
                {averageRating}/5
              </span>
              <span className="text-sm sm:text-base text-gray-600" data-testid="review-count">
                Based on {reviews?.length || 281}+ Google Reviews
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-4 mr-1" />
                      ))}
                    </div>
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center">
              <p className="text-red-600">Failed to load reviews. Please try again later.</p>
            </div>
          ) : (
            reviews?.map((review) => (
              <div 
                key={review.id} 
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg review-card"
                data-testid={`review-${review.id}`}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-johnson-blue rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {review.customerName.charAt(0)}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base" data-testid={`review-customer-${review.id}`}>
                      {review.customerName}
                    </h4>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${i < parseFloat(review.rating) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed" data-testid={`review-comment-${review.id}`}>
                  "{review.comment}"
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs sm:text-sm">
                  <span className="text-gray-500 font-medium" data-testid={`review-service-${review.id}`}>
                    {review.serviceName}
                  </span>
                  <span className="text-gray-500" data-testid={`review-time-${review.id}`}>
                    {formatTimeAgo(review.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-johnson-blue text-johnson-blue hover:bg-johnson-blue hover:text-white"
            data-testid="view-all-reviews-button"
          >
            <a 
              href="https://www.google.com/search?q=Johnson+Bros+Plumbing+reviews" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Read All Google Reviews</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
