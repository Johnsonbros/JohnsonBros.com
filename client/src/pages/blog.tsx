import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type BlogPost } from "@shared/schema";
import { SEO } from "@/components/SEO";

function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-blog-post-${post.id}`}>
        {post.featuredImage && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img 
              src={post.featuredImage} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {post.category && (
              <Badge variant="secondary">{post.category}</Badge>
            )}
            {post.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTime} min read
              </span>
            )}
          </div>
          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
          <CardDescription className="line-clamp-3">
            {post.excerpt || post.content.substring(0, 150) + "..."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {post.publishDate ? format(new Date(post.publishDate), "MMM dd, yyyy") : "Draft"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount} views
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-[--primary-gold]" />
        </CardFooter>
      </Card>
    </Link>
  );
}

function BlogSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="h-full">
          <Skeleton className="aspect-video w-full rounded-t-lg" />
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

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 9;

  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts", { status: "published", limit, offset: page * limit }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, any];
      const searchParams = new URLSearchParams(params);
      const response = await fetch(`/api/blog/posts?${searchParams}`);
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

  const categories = ["all", "tips", "maintenance", "emergency", "installation", "seasonal"];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Blog | Plumbing Tips & Insights | Johnson Bros. Plumbing Quincy MA"
        description="Expert plumbing advice, maintenance tips, and home improvement guides from Johnson Bros. Plumbing. Learn how to prevent frozen pipes, maintain your water heater, and more."
        keywords={["plumbing blog", "plumbing tips", "home maintenance", "Quincy plumber blog", "DIY plumbing", "water heater tips", "drain cleaning advice"]}
        url="/blog"
        type="website"
      />
      <Header />
      
      <main className="flex-1">
        <section className="py-16 bg-[--primary-dark]">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
              Plumbing Tips & Insights
            </h1>
            <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
              Expert advice from Johnson Bros. Plumbing to keep your home's plumbing running smoothly
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:max-w-xs"
                data-testid="input-search-blog"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="md:max-w-xs" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading && <BlogSkeleton />}
            
            {error && (
              <div className="text-center py-8 text-red-600">
                Failed to load blog posts. Please try again later.
              </div>
            )}

            {filteredPosts && filteredPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="text-center py-8 text-gray-600">
                  No blog posts found. Check back soon for helpful plumbing tips!
                </div>
              )
            )}

            {posts && posts.length === limit && (
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-[--primary-gold] text-white rounded-lg disabled:opacity-50"
                  data-testid="button-prev-page"
                >
                  Previous
                </button>
                <span className="px-4 py-2">Page {page + 1}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-[--primary-gold] text-white rounded-lg"
                  data-testid="button-next-page"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}