import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, ArrowLeft, Share2, Tag } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { type BlogPost, type Keyword } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { generateArticleStructuredData } from "@/lib/structuredData";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPostWithKeywords extends BlogPost {
  keywords?: Keyword[];
}

function BlogPostSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-10 w-3/4 mb-4" />
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="aspect-video w-full rounded-lg mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: post, isLoading, error } = useQuery<BlogPostWithKeywords>({
    queryKey: [`/api/v1/blog/posts/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/v1/blog/posts/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error("Failed to fetch post");
      }
      return response.json();
    },
    enabled: !!slug
  });

  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title || "Blog Post";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: post?.excerpt || post?.metaDescription || "",
          url
        });
      } catch (err) {
        // User cancelled share, do nothing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The blog post link has been copied to your clipboard."
      });
    }
  };


  if (error) {
    return (
      <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      {post && (
        <SEO
          title={post.metaTitle || post.title}
          description={post.metaDescription || post.excerpt || undefined}
          keywords={post.tags || []}
          type="article"
          author={post.author || "Johnson Bros. Plumbing"}
          publishedTime={post.publishDate ? new Date(post.publishDate).toISOString() : undefined}
          modifiedTime={post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined}
          url={`/blog/${post.slug}`}
          structuredData={generateArticleStructuredData({
            title: post.title,
            description: post.metaDescription || post.excerpt || undefined,
            author: post.author,
            publishDate: post.publishDate,
            modifiedDate: post.updatedAt,
            image: post.featuredImage || undefined,
            url: `https://johnsonbrosplumbing.com/blog/${post.slug}`
          })}
        />
      )}
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          {isLoading && <BlogPostSkeleton />}

          {post && (
            <article className="max-w-4xl mx-auto">
              {/* Article Header */}
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
                  {post.title}
                </h1>
                
                {post.excerpt && (
                  <p className="text-xl text-gray-600 mb-6" data-testid="text-blog-excerpt">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  {post.category && (
                    <Badge variant="secondary" className="text-sm">
                      {post.category}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.publishDate ? format(new Date(post.publishDate), "MMMM dd, yyyy") : "Draft"}
                  </span>
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readingTime} min read
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.viewCount} views
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleShare}
                    className="ml-auto"
                    data-testid="button-share"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>

                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full rounded-lg shadow-lg"
                    loading="lazy"
                  />
                )}
              </header>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none mb-12" data-testid="text-blog-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{children}</h1>,
                    h2: ({children}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">{children}</h2>,
                    h3: ({children}) => <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900">{children}</h3>,
                    h4: ({children}) => <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h4>,
                    p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 ml-4 space-y-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 ml-4 space-y-2">{children}</ol>,
                    li: ({children}) => <li className="text-gray-700">{children}</li>,
                    strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                    em: ({children}) => <em className="italic">{children}</em>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-johnson-orange pl-4 py-2 my-4 bg-orange-50 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    code: ({className, children}) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                      ) : (
                        <code className="block bg-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm text-gray-800 mb-4">
                          {children}
                        </code>
                      );
                    },
                    a: ({href, children}) => (
                      <a href={href} className="text-johnson-orange hover:text-orange-600 underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* Keywords/Tags */}
              {post.keywords && post.keywords.length > 0 && (
                <div className="border-t pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-600">Related Topics:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.keywords.map((keyword) => (
                      <Badge key={keyword.id} variant="outline" className="text-sm">
                        {keyword.keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="bg-[--primary-gold] bg-opacity-10 rounded-lg p-8 mt-12 text-center">
                <h3 className="text-2xl font-bold mb-4">Need Professional Plumbing Help?</h3>
                <p className="text-gray-700 mb-6">
                  Our expert team at Johnson Bros. Plumbing is ready to assist you with all your plumbing needs.
                </p>
                <Link href="/#booking">
                  <Button size="lg" className="bg-[--primary-gold] hover:bg-[--primary-gold-dark]">
                    Schedule Service Now
                  </Button>
                </Link>
              </div>

              {/* Author Info */}
              <div className="border-t pt-8 mt-12">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-[--primary-gold] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    JB
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{post.author}</p>
                    <p className="text-gray-600">Expert Plumbing Services in Quincy, MA</p>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
