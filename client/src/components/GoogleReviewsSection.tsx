import { useQuery } from "@tanstack/react-query";
import { Star, ExternalLink, MapPin, Clock, ChevronLeft, ChevronRight, MessageSquare, ArrowRight } from "lucide-react";
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
  
  const { data: googleData, isLoading, error } = useQuery<GoogleReviewsData>({
    queryKey: ["/api/v1/google-reviews"],
    refetchOnWindowFocus: true,
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      skipSnaps: false,
      duration: 30,
      dragFree: false
    }, 
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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
    <section className="py-16 bg-white dark:bg-slate-950" data-testid="google-reviews-section">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
              Real Stories. Real Results.
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-100 dark:border-yellow-800/50">
                <div className="flex gap-0.5">{renderStars(5)}</div>
                <span className="ml-1 font-black text-johnson-blue dark:text-yellow-400">{googleData.averageRating.toFixed(1)}</span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block" />
              <div className="text-johnson-blue dark:text-johnson-blue/80 font-bold flex items-center gap-2">
                <span className="bg-johnson-blue text-white px-2 py-0.5 rounded text-xs">{googleData.totalReviews}</span>
                <span className="uppercase text-sm tracking-wide">Google Reviews</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollPrev} 
              className="rounded-full border-johnson-blue text-johnson-blue hover:bg-johnson-blue hover:text-white transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollNext} 
              className="rounded-full border-johnson-blue text-johnson-blue hover:bg-johnson-blue hover:text-white transition-all shadow-sm active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {googleData.reviews.filter(r => r.rating === 5).slice(0, 15).map((review) => (
              <div key={review.id} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-4 py-4">
                <Card className="h-full border-2 border-slate-50 dark:border-slate-800 hover:border-johnson-blue/30 dark:hover:border-johnson-blue/50 transition-all duration-300 group shadow-sm hover:shadow-xl dark:bg-slate-900 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <MessageSquare className="h-16 w-16 text-johnson-blue" />
                  </div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      {review.profilePhoto ? (
                        <img src={review.profilePhoto} alt={review.author} className="h-12 w-12 rounded-full border-2 border-white dark:border-slate-700 shadow-md object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-johnson-blue/10 text-johnson-blue flex items-center justify-center font-black text-lg border-2 border-white dark:border-slate-700 shadow-md">
                          {review.author[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-black text-slate-900 dark:text-white tracking-tight">{review.author}</div>
                        <div className="flex gap-0.5 mt-0.5">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <blockquote className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic mb-8 relative">
                      <span className="text-4xl text-johnson-blue/20 absolute -top-4 -left-2 font-serif">"</span>
                      <span className="line-clamp-4 font-medium">{review.text}</span>
                      <span className="text-4xl text-johnson-blue/20 absolute -bottom-8 -right-2 font-serif">"</span>
                    </blockquote>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      <div className="flex items-center gap-1.5 group-hover:text-johnson-blue transition-colors">
                        <MapPin className="h-3 w-3" />
                        {review.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(review.time)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/reviews">
            <Button className="bg-johnson-blue hover:bg-johnson-blue/90 text-white font-black px-8 py-6 rounded-full shadow-lg hover:shadow-johnson-blue/20 hover:scale-105 transition-all group">
              <MessageSquare className="mr-3 h-5 w-5" />
              EXPLORE ALL {googleData.totalReviews} REVIEWS
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </Link>
          <p className="mt-4 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
            Licensed & Insured Plumbing Professionals
          </p>
        </div>
      </div>
    </section>
  );
}