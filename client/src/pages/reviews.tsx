import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Clock, ExternalLink, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { SEO } from "@/components/SEO";

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

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const { data: googleData, isLoading } = useQuery<GoogleReviewsData>({
    queryKey: ["/api/v1/google-reviews"],
    staleTime: 5 * 60 * 1000,
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
    ));
  };

  const filteredReviews = googleData?.reviews.filter(review => {
    const matchesSearch = review.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          review.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || review.location.includes(locationFilter);
    return matchesSearch && matchesLocation;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title="Customer Reviews - Johnson Bros. Plumbing & Drain Cleaning"
        description="Read real customer reviews for Johnson Bros. Plumbing. See why we're the top-rated plumbers in Quincy, Abington, and the South Shore."
      />
      <Header onBookService={() => {}} />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">What Our Neighbors Are Saying</h1>
            <p className="text-xl text-gray-600 mb-8">
              We're proud to serve our community with honest, reliable plumbing service. 
              Read through {googleData?.totalReviews || 'hundreds of'} verified reviews from across the South Shore.
            </p>
            
            {googleData && (
              <div className="flex flex-wrap justify-center gap-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-center">
                  <div className="text-5xl font-black text-johnson-blue">{googleData.averageRating.toFixed(1)}</div>
                  <div className="flex justify-center my-2">{renderStars(5)}</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Average Rating</div>
                </div>
                <div className="w-px bg-slate-100 hidden md:block" />
                <div className="text-center">
                  <div className="text-5xl font-black text-johnson-blue">{googleData.totalReviews}</div>
                  <div className="text-lg font-bold text-yellow-500 my-2">Google Reviews</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Across All Locations</div>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-6xl mx-auto bg-white p-4 rounded-xl shadow-sm mb-12 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search reviews (e.g. 'drain', 'emergency', 'professional')..." 
                className="pl-10 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button 
                variant={locationFilter === null ? "default" : "outline"}
                onClick={() => setLocationFilter(null)}
                className="h-12 whitespace-nowrap font-bold"
              >
                All Locations
              </Button>
              {googleData?.locations.map(loc => (
                <Button 
                  key={loc.placeId}
                  variant={locationFilter === loc.name ? "default" : "outline"}
                  onClick={() => setLocationFilter(loc.name)}
                  className="h-12 whitespace-nowrap font-bold"
                >
                  {loc.name.split('-').pop()?.trim()}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {isLoading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="h-64"><CardContent className="p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
              ))
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow border-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {review.profilePhoto ? (
                        <img src={review.profilePhoto} alt="" className="h-12 w-12 rounded-full" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xl">
                          {review.author[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{review.author}</div>
                        <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6 italic">"{review.text}"</p>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {review.location.split('-').pop()?.trim()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(review.time)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-2xl font-bold text-gray-400">No reviews found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer onBookService={() => {}} />
    </div>
  );
}
