import { useQuery } from "@tanstack/react-query";
import { Star, ExternalLink, MapPin, Clock, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from "wouter";

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
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Defer API call to improve initial page load performance
  useEffect(() => {
    const timer = setTimeout(() => setShouldFetch(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay()]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (error) {
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

  if (isLoading || !shouldFetch) {
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
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Success Stories</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {renderStars(5)}
                <span className="ml-2 font-bold text-lg">{googleData.averageRating.toFixed(1)}</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="text-gray-600 font-medium">{googleData.totalReviews} Google Reviews</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={scrollPrev} className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={scrollNext} className="rounded-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {googleData.reviews.filter(r => r.rating === 5).slice(0, 12).map((review) => (
              <div key={review.id} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-4">
                <Card className="h-full shadow-md border-slate-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {review.profilePhoto ? (
                        <img src={review.profilePhoto} alt="" className="h-10 w-10 rounded-full" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {review.author[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-gray-900">{review.author}</div>
                        <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-4 italic mb-4">"{review.text}"</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {review.location.split('-').pop()?.trim()}
                      </div>
                      <div>{formatTimeAgo(review.time)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/reviews">
            <Button variant="outline" className="border-johnson-blue text-johnson-blue hover:bg-johnson-blue hover:text-white font-bold group">
              <MessageSquare className="mr-2 h-4 w-4" />
              View All Customer Reviews
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}