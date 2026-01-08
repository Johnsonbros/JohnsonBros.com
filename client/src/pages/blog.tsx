import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, ArrowRight, Search, Droplets, Wrench, AlertTriangle, Flame, ThermometerSun } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { type BlogPost } from "@shared/schema";
import { SEO } from "@/components/SEO";

const categoryIcons: Record<string, typeof Droplets> = {
  tips: Wrench,
  maintenance: Droplets,
  emergency: AlertTriangle,
  installation: Flame,
  seasonal: ThermometerSun,
};

const categoryColors: Record<string, string> = {
  tips: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-green-100 text-green-700 border-green-200",
  emergency: "bg-red-100 text-red-700 border-red-200",
  installation: "bg-orange-100 text-orange-700 border-orange-200",
  seasonal: "bg-purple-100 text-purple-700 border-purple-200",
};

function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group" data-testid={`card-featured-post-${post.id}`}>
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-johnson-blue to-blue-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
        {post.featuredImage ? (
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-[400px] md:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-[400px] md:h-[500px] bg-gradient-to-br from-johnson-orange/30 to-johnson-blue/30"></div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-johnson-orange text-white border-0 font-bold">
              Featured
            </Badge>
            {post.category && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 group-hover:text-johnson-orange transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-200 text-lg mb-4 line-clamp-2 max-w-3xl">
            {post.excerpt || post.content.replace(/[#*\n]/g, ' ').substring(0, 200)}
          </p>
          <div className="flex items-center gap-6 text-gray-300 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.publishDate ? format(new Date(post.publishDate), "MMMM dd, yyyy") : "Draft"}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readingTime || 5} min read
            </span>
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {post.viewCount || 0} views
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const CategoryIcon = categoryIcons[post.category || "tips"] || Wrench;
  const categoryColor = categoryColors[post.category || "tips"] || categoryColors.tips;
  
  return (
    <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-johnson-orange/30 overflow-hidden group cursor-pointer bg-white" data-testid={`card-blog-post-${post.id}`}>
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <div className="relative">
          {post.featuredImage ? (
            <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="aspect-[16/10] w-full bg-gradient-to-br from-johnson-blue/10 to-johnson-orange/10 flex items-center justify-center">
              <CategoryIcon className="w-16 h-16 text-johnson-orange/30" />
            </div>
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <Badge className={`${categoryColor} border font-semibold`}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              </Badge>
            </div>
          )}
        </div>
        <CardHeader className="space-y-3 pb-2">
          <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-johnson-orange transition-colors leading-tight">
            {post.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-gray-600 text-sm">
            {post.excerpt || post.content.replace(/[#*\n]/g, ' ').substring(0, 120) + "..."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-0 pb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between w-full text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.publishDate ? format(new Date(post.publishDate), "MMM dd") : "Draft"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTime || 5} min
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-1 text-johnson-orange font-semibold text-sm group-hover:gap-2 transition-all w-full">
            Read Article
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}

function BlogSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="h-full">
          <Skeleton className="aspect-[16/10] w-full rounded-t-lg" />
          <CardHeader>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardFooter>
            <Skeleton className="h-4 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

const categories = [
  { id: "all", label: "All Posts", icon: Wrench },
  { id: "tips", label: "Tips & Tricks", icon: Wrench },
  { id: "maintenance", label: "Maintenance", icon: Droplets },
  { id: "emergency", label: "Emergency", icon: AlertTriangle },
  { id: "installation", label: "Installation", icon: Flame },
  { id: "seasonal", label: "Seasonal", icon: ThermometerSun },
];

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 9;

  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/v1/blog/posts", { status: "published", limit: 50, offset: 0 }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, any];
      const searchParams = new URLSearchParams(params);
      const response = await fetch(`/api/v1/blog/posts?${searchParams}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    }
  });

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts?.[0];
  const regularPosts = filteredPosts?.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 lg:pb-0">
      <SEO
        title="Blog | Plumbing Tips & Insights | Johnson Bros. Plumbing Quincy MA"
        description="Expert plumbing advice, maintenance tips, and home improvement guides from Johnson Bros. Plumbing. Learn how to prevent frozen pipes, maintain your water heater, and more."
        keywords={["plumbing blog", "plumbing tips", "home maintenance", "Quincy plumber blog", "DIY plumbing", "water heater tips", "drain cleaning advice"]}
        url="/blog"
        type="website"
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-johnson-blue via-blue-800 to-blue-900 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-johnson-orange rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="bg-johnson-orange/20 text-johnson-orange border-johnson-orange/30 mb-4 px-4 py-1">
                Expert Plumbing Knowledge
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Plumbing Tips & <span className="text-johnson-orange">Insights</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Expert advice from Johnson Bros. Plumbing to keep your home's plumbing running smoothly. 
                From DIY fixes to knowing when to call a pro.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <label htmlFor="blog-search" className="sr-only">Search blog articles</label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="blog-search"
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl bg-white/95 backdrop-blur-sm"
                  data-testid="input-search-blog"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-6 bg-white border-b sticky top-0 z-30 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 sm:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] touch-target ${
                      isSelected 
                        ? "bg-johnson-orange text-white shadow-lg shadow-johnson-orange/30" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading && <BlogSkeleton />}
            
            {error && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Posts</h3>
                <p className="text-gray-600">Please try again later.</p>
              </div>
            )}

            {filteredPosts && filteredPosts.length > 0 ? (
              <div className="space-y-12">
                {/* Featured Post */}
                {featuredPost && selectedCategory === "all" && !searchTerm && (
                  <div className="mb-8">
                    <FeaturedPostCard post={featuredPost} />
                  </div>
                )}

                {/* Regular Posts Grid */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCategory === "all" ? "Latest Articles" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Articles`}
                    </h2>
                    <span className="text-gray-500 text-sm">
                      {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(selectedCategory === "all" && !searchTerm ? regularPosts : filteredPosts)?.map(post => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? `No articles matching "${searchTerm}"` 
                      : "Check back soon for helpful plumbing tips!"}
                  </p>
                  {searchTerm && (
                    <Button 
                      onClick={() => setSearchTerm("")}
                      variant="outline"
                      data-testid="button-clear-search"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )
            )}

            {/* Pagination */}
            {posts && posts.length >= limit && (
              <div className="flex justify-center gap-4 mt-12">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  variant="outline"
                  className="px-6"
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-600 font-medium">Page {page + 1}</span>
                <Button
                  onClick={() => setPage(page + 1)}
                  className="px-6 bg-johnson-orange hover:bg-orange-600"
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-gradient-to-r from-johnson-blue to-blue-800">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Need Plumbing Help?
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Don't wait for a small problem to become a big emergency. 
                Our expert plumbers are ready to help with any plumbing issue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" className="bg-johnson-orange hover:bg-orange-600 text-white px-8 shadow-xl" data-testid="button-book-service-blog">
                    Book a Service Call
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="tel:6174799911">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8" data-testid="button-call-blog">
                    Call (617) 479-9911
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
