import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/auth';

// Types
export interface GmbLocation {
  name: string;
  title: string;
  address: string;
  phoneNumber: string;
  websiteUrl: string;
}

export interface GmbOverview {
  location: GmbLocation;
  isConfigured: boolean;
  stats: {
    publishedPosts: number;
    pendingReviews: number;
    pendingPhotos: number;
    averageRating: number;
    totalReviews: number;
  };
}

export interface GmbPost {
  id: string;
  googlePostId: string | null;
  type: string;
  title: string | null;
  content: string;
  callToAction: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface GmbReview {
  id: string;
  googleReviewId: string;
  reviewerName: string;
  reviewerPhotoUrl: string | null;
  starRating: number;
  comment: string | null;
  reviewCreatedAt: string;
  responseText: string | null;
  responseCreatedAt: string | null;
  autoResponded: boolean;
  needsResponse: boolean;
  sentiment: string | null;
  topics: string[] | null;
}

export interface GmbTemplate {
  id: string;
  name: string;
  starRating: number | null;
  sentiment: string | null;
  template: string;
  useCount: number;
  isActive: boolean;
}

export interface GmbPhoto {
  id: string;
  jobId: string;
  customerId: string | null;
  photoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  category: string | null;
  uploadedToGoogle: boolean;
  approved: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Hooks
export function useGmbOverview() {
  return useQuery<{ success: boolean; data: GmbOverview }>({
    queryKey: ['/api/admin/gmb/overview'],
    queryFn: () => authenticatedFetch('/api/admin/gmb/overview'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGmbPosts(page: number = 1, status?: string) {
  return useQuery<{
    success: boolean;
    data: {
      posts: GmbPost[];
      pagination: Pagination;
    };
  }>({
    queryKey: ['/api/admin/gmb/posts', page, status],
    queryFn: () => {
      let url = `/api/admin/gmb/posts?page=${page}&limit=10`;
      if (status) url += `&status=${status}`;
      return authenticatedFetch(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useGmbReviews(page: number = 1, needsResponse?: boolean) {
  return useQuery<{
    success: boolean;
    data: {
      reviews: GmbReview[];
      pagination: Pagination;
    };
  }>({
    queryKey: ['/api/admin/gmb/reviews', page, needsResponse],
    queryFn: () => {
      let url = `/api/admin/gmb/reviews?page=${page}&limit=10`;
      if (needsResponse) url += '&needsResponse=true';
      return authenticatedFetch(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useGmbTemplates() {
  return useQuery<{ success: boolean; data: GmbTemplate[] }>({
    queryKey: ['/api/admin/gmb/templates'],
    queryFn: () => authenticatedFetch('/api/admin/gmb/templates'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGmbPhotos(page: number = 1, pending?: boolean) {
  return useQuery<{
    success: boolean;
    data: {
      photos: GmbPhoto[];
      pagination: Pagination;
    };
  }>({
    queryKey: ['/api/admin/gmb/photos', page, pending],
    queryFn: () => {
      let url = `/api/admin/gmb/photos?page=${page}&limit=12`;
      if (pending) url += '&pending=true';
      return authenticatedFetch(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useGmbAnalytics() {
  return useQuery<{
    success: boolean;
    data: {
      ratings: Array<{ starRating: number; count: number }>;
      recentReviews: number;
      reviewTrend: Array<{ date: string; rating: number }>;
      posts: Array<{ status: string; count: number }>;
      responseRate: {
        total: number;
        responded: number;
        autoResponded: number;
        rate: string;
      };
    };
  }>({
    queryKey: ['/api/admin/gmb/analytics'],
    queryFn: () => authenticatedFetch('/api/admin/gmb/analytics'),
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: GmbPost },
    Error,
    {
      type: string;
      content: string;
      title?: string;
      callToAction?: string;
      ctaUrl?: string;
      imageUrl?: string;
      scheduledFor?: string;
    }
  >({
    mutationFn: async (data) => {
      const response = await fetch('/api/admin/gmb/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/overview'] });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { postId: string }>({
    mutationFn: async ({ postId }) => {
      const response = await fetch(`/api/admin/gmb/posts/${postId}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to publish post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/overview'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { postId: string }>({
    mutationFn: async ({ postId }) => {
      const response = await fetch(`/api/admin/gmb/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/posts'] });
    },
  });
}

export function useSyncReviews() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: { synced: number; newReviews: number } },
    Error
  >({
    mutationFn: async () => {
      const response = await fetch('/api/admin/gmb/reviews/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to sync reviews');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/overview'] });
    },
  });
}

export function useGenerateResponse() {
  return useMutation<
    { success: boolean; data: { reviewId: string; options: string[] } },
    Error,
    { reviewId: string; count?: number }
  >({
    mutationFn: async ({ reviewId, count = 3 }) => {
      const response = await fetch(`/api/admin/gmb/reviews/${reviewId}/generate-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ count }),
      });
      if (!response.ok) throw new Error('Failed to generate response');
      return response.json();
    },
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { reviewId: string; responseText: string }
  >({
    mutationFn: async ({ reviewId, responseText }) => {
      const response = await fetch(`/api/admin/gmb/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ responseText }),
      });
      if (!response.ok) throw new Error('Failed to respond to review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/overview'] });
    },
  });
}

export function useAutoRespond() {
  const queryClient = useQueryClient();

  return useMutation<
    {
      success: boolean;
      data: {
        processed: number;
        autoResponded: number;
        flaggedForReview: number;
      };
    },
    Error
  >({
    mutationFn: async () => {
      const response = await fetch('/api/admin/gmb/reviews/auto-respond', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to auto-respond');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/reviews'] });
    },
  });
}

export function useApprovePhoto() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { photoId: string; createPost?: boolean; postContent?: string }
  >({
    mutationFn: async ({ photoId, createPost, postContent }) => {
      const response = await fetch(`/api/admin/gmb/photos/${photoId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ createPost, postContent }),
      });
      if (!response.ok) throw new Error('Failed to approve photo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gmb/overview'] });
    },
  });
}

// Helper
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
