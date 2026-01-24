import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Star,
  MessageSquare,
  Image,
  FileText,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Upload,
} from 'lucide-react';
import {
  useGmbOverview,
  useGmbPosts,
  useGmbReviews,
  useGmbPhotos,
  useGmbAnalytics,
  useCreatePost,
  usePublishPost,
  useDeletePost,
  useSyncReviews,
  useGenerateResponse,
  useRespondToReview,
  useAutoRespond,
  useApprovePhoto,
  GmbReview,
  GmbPost,
} from './gmb-dashboard.hooks';

export default function GmbDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [postsPage, setPostsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [photosPage, setPhotosPage] = useState(1);
  const [showPendingReviews, setShowPendingReviews] = useState(false);
  const [showPendingPhotos, setShowPendingPhotos] = useState(true);

  // Selected items for dialogs
  const [selectedReview, setSelectedReview] = useState<GmbReview | null>(null);
  const [responseOptions, setResponseOptions] = useState<string[]>([]);
  const [selectedResponse, setSelectedResponse] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Data fetching
  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useGmbOverview();
  const { data: postsData, isLoading: postsLoading } = useGmbPosts(postsPage);
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useGmbReviews(
    reviewsPage,
    showPendingReviews
  );
  const { data: photosData, isLoading: photosLoading } = useGmbPhotos(photosPage, showPendingPhotos);
  const { data: analyticsData } = useGmbAnalytics();

  // Mutations
  const createPost = useCreatePost();
  const publishPost = usePublishPost();
  const deletePost = useDeletePost();
  const syncReviews = useSyncReviews();
  const generateResponse = useGenerateResponse();
  const respondToReview = useRespondToReview();
  const autoRespond = useAutoRespond();
  const approvePhoto = useApprovePhoto();

  const overview = overviewData?.data;
  const posts = postsData?.data?.posts || [];
  const postsPagination = postsData?.data?.pagination;
  const reviews = reviewsData?.data?.reviews || [];
  const reviewsPagination = reviewsData?.data?.pagination;
  const photos = photosData?.data?.photos || [];
  const photosPagination = photosData?.data?.pagination;
  const analytics = analyticsData?.data;

  // Helpers
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleGenerateResponse = async (review: GmbReview) => {
    setSelectedReview(review);
    setResponseOptions([]);
    setSelectedResponse('');

    const result = await generateResponse.mutateAsync({ reviewId: review.id, count: 3 });
    if (result.success) {
      setResponseOptions(result.data.options);
      if (result.data.options.length > 0) {
        setSelectedResponse(result.data.options[0]);
      }
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !selectedResponse) return;

    await respondToReview.mutateAsync({
      reviewId: selectedReview.id,
      responseText: selectedResponse,
    });

    setSelectedReview(null);
    setResponseOptions([]);
    setSelectedResponse('');
    refetchReviews();
  };

  const handleSync = async () => {
    await syncReviews.mutateAsync();
    refetchReviews();
    refetchOverview();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Google My Business</h1>
          <p className="text-muted-foreground">
            Manage posts, reviews, and photos for your Google Business Profile
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncReviews.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncReviews.isPending ? 'animate-spin' : ''}`} />
            Sync Reviews
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {overviewLoading ? '...' : overview?.stats.averageRating.toFixed(1) || '0'}
              </span>
              <div className="flex">{renderStars(Math.round(overview?.stats.averageRating || 0))}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.stats.totalReviews || 0} total reviews
            </p>
          </CardContent>
        </Card>

        <Card className={overview?.stats.pendingReviews ? 'border-yellow-300 bg-yellow-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${overview?.stats.pendingReviews ? 'text-yellow-600' : ''}`}>
              {overviewLoading ? '...' : overview?.stats.pendingReviews || 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Published Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {overviewLoading ? '...' : overview?.stats.publishedPosts || 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4" />
              Pending Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {overviewLoading ? '...' : overview?.stats.pendingPhotos || 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {analytics?.responseRate.rate || '0'}%
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.responseRate.autoResponded || 0} auto-responded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews
            {overview?.stats.pendingReviews ? (
              <Badge variant="secondary" className="ml-2">
                {overview.stats.pendingReviews}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="photos">
            Photos
            {overview?.stats.pendingPhotos ? (
              <Badge variant="secondary" className="ml-2">
                {overview.stats.pendingPhotos}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.reviewerName}</span>
                        <div className="flex">{renderStars(review.starRating)}</div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.comment || 'No comment'}
                      </p>
                    </div>
                    {review.needsResponse && !review.responseText && (
                      <Badge variant="outline" className="text-yellow-600">
                        Needs Response
                      </Badge>
                    )}
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No reviews yet</p>
                )}
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = analytics?.ratings.find(r => r.starRating === rating)?.count || 0;
                  const total = analytics?.ratings.reduce((sum, r) => sum + r.count, 0) || 1;
                  const percentage = (count / total) * 100;

                  return (
                    <div key={rating} className="flex items-center gap-2 mb-2">
                      <span className="w-3 text-sm">{rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm text-right">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={showPendingReviews ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPendingReviews(!showPendingReviews)}
              >
                {showPendingReviews ? 'Show All' : 'Show Pending Only'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoRespond.mutateAsync()}
                disabled={autoRespond.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-Respond to Positive
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="max-w-[300px]">Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading reviews...
                      </TableCell>
                    </TableRow>
                  ) : reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No reviews found
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{review.reviewerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.reviewCreatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex">{renderStars(review.starRating)}</div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm line-clamp-2">{review.comment || 'No comment'}</p>
                          {review.responseText && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Responded {review.autoResponded ? '(auto)' : ''}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {review.responseText ? (
                            <Badge className="bg-green-500">Responded</Badge>
                          ) : review.needsResponse ? (
                            <Badge variant="outline" className="text-yellow-600">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary">—</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!review.responseText && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateResponse(review)}
                              disabled={generateResponse.isPending}
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              Generate
                            </Button>
                          )}
                          {review.responseText && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {reviewsPagination && reviewsPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                disabled={reviewsPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {reviewsPage} of {reviewsPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewsPage((p) => Math.min(reviewsPagination.totalPages, p + 1))}
                disabled={reviewsPage === reviewsPagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={() => setShowCreatePost(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="max-w-[400px]">Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading posts...
                      </TableCell>
                    </TableRow>
                  ) : posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No posts yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <Badge variant="outline">{post.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[400px]">
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          {post.imageUrl && (
                            <p className="text-xs text-blue-600 mt-1">📷 Has image</p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : post.scheduledFor
                            ? `Scheduled: ${new Date(post.scheduledFor).toLocaleDateString()}`
                            : 'Draft'}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {post.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => publishPost.mutateAsync({ postId: post.id })}
                              disabled={publishPost.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePost.mutateAsync({ postId: post.id })}
                            disabled={deletePost.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              variant={showPendingPhotos ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPendingPhotos(!showPendingPhotos)}
            >
              {showPendingPhotos ? 'Show All' : 'Show Pending Only'}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {photosLoading ? (
              <p className="col-span-full text-center py-8">Loading photos...</p>
            ) : photos.length === 0 ? (
              <p className="col-span-full text-center py-8 text-muted-foreground">
                No photos found
              </p>
            ) : (
              photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={photo.thumbnailUrl || photo.photoUrl}
                      alt={photo.caption || 'Job photo'}
                      className="object-cover w-full h-full"
                    />
                    {photo.approved && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                      </div>
                    )}
                    {photo.category && (
                      <Badge className="absolute bottom-2 left-2" variant="secondary">
                        {photo.category}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground truncate">
                      Job: {photo.jobId}
                    </p>
                    {!photo.approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          approvePhoto.mutateAsync({
                            photoId: photo.id,
                            createPost: true,
                            postContent: `Check out our latest work! ${photo.caption || ''}`,
                          })
                        }
                        disabled={approvePhoto.isPending}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Approve & Post
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {photosPagination && photosPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhotosPage((p) => Math.max(1, p - 1))}
                disabled={photosPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {photosPage} of {photosPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhotosPage((p) => Math.min(photosPagination.totalPages, p + 1))}
                disabled={photosPage === photosPagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Response Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Review from {selectedReview?.reviewerName} ({selectedReview?.starRating} stars)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm italic">"{selectedReview?.comment}"</p>
            </div>

            {generateResponse.isPending ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Generating response options...
              </div>
            ) : responseOptions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Select or edit a response:</p>
                {responseOptions.map((option, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                      selectedResponse === option ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedResponse(option)}
                  >
                    <p className="text-sm">{option}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div>
              <p className="text-sm font-medium mb-2">Your response:</p>
              <Textarea
                value={selectedResponse}
                onChange={(e) => setSelectedResponse(e.target.value)}
                rows={4}
                placeholder="Write your response..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={!selectedResponse || respondToReview.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        onSubmit={async (data) => {
          await createPost.mutateAsync(data);
          setShowCreatePost(false);
        }}
        isLoading={createPost.isPending}
      />
    </div>
  );
}

// Create Post Dialog Component
function CreatePostDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const [type, setType] = useState('update');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaType, setCtaType] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  const handleSubmit = async () => {
    await onSubmit({
      type,
      content,
      imageUrl: imageUrl || undefined,
      callToAction: ctaType || undefined,
      ctaUrl: ctaUrl || undefined,
    });
    setContent('');
    setImageUrl('');
    setCtaType('');
    setCtaUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>Create a post for your Google Business Profile</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Post Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Write your post content..."
              maxLength={1500}
            />
            <p className="text-xs text-muted-foreground mt-1">{content.length}/1500</p>
          </div>

          <div>
            <label className="text-sm font-medium">Image URL (optional)</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Call to Action</label>
              <Select value={ctaType} onValueChange={setCtaType}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="BOOK">Book</SelectItem>
                  <SelectItem value="CALL">Call</SelectItem>
                  <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ctaType && ctaType !== 'CALL' && (
              <div>
                <label className="text-sm font-medium">CTA URL</label>
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!content || isLoading}>
            Create Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
