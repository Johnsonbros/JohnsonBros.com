import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/auth';

// Types
export interface SeoMetricsSummary {
  indexedPages: number;
  crawlErrors: number;
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  organicSessions: number;
  organicUsers: number;
  activeAlerts: number;
  lastUpdated: string | null;
  previousIndexedPages: number | null;
  previousPosition: number | null;
}

export interface SeoMetricsHistoryItem {
  date: string;
  indexedPages: number | null;
  totalClicks: number | null;
  totalImpressions: number | null;
  averageCtr: number | null;
  averagePosition: number | null;
  crawlErrors: number | null;
}

export interface IndexCoverageItem {
  id: string;
  url: string;
  status: string;
  lastCrawled: string | null;
  errorType: string | null;
  checkedAt: string;
}

export interface CrawlError {
  id: string;
  url: string;
  errorType: string | null;
  lastCrawled: string | null;
  checkedAt: string;
}

export interface LiveCrawlError {
  url: string;
  category: string;
  platform: string;
  lastCrawled: string;
  responseCode: number;
}

export interface SearchAnalyticsItem {
  query?: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SeoAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  url: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Hooks
export function useSeoMetricsSummary() {
  return useQuery<{ success: boolean; data: SeoMetricsSummary }>({
    queryKey: ['/api/admin/seo/metrics/summary'],
    queryFn: () => authenticatedFetch('/api/admin/seo/metrics/summary'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useSeoMetricsHistory(startDate: string, endDate: string) {
  return useQuery<{
    success: boolean;
    data: {
      startDate: string;
      endDate: string;
      metrics: SeoMetricsHistoryItem[];
    };
  }>({
    queryKey: ['/api/admin/seo/metrics/history', startDate, endDate],
    queryFn: () =>
      authenticatedFetch(
        `/api/admin/seo/metrics/history?startDate=${startDate}&endDate=${endDate}`
      ),
    staleTime: 5 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  });
}

export function useIndexCoverage(page: number, status?: string) {
  return useQuery<{
    success: boolean;
    data: {
      urls: IndexCoverageItem[];
      pagination: Pagination;
    };
  }>({
    queryKey: ['/api/admin/seo/index-coverage', page, status],
    queryFn: () => {
      let url = `/api/admin/seo/index-coverage?page=${page}&limit=10`;
      if (status) url += `&status=${status}`;
      return authenticatedFetch(url);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCrawlErrors(page: number) {
  return useQuery<{
    success: boolean;
    data: {
      errors: CrawlError[];
      liveErrors: LiveCrawlError[];
      pagination: Pagination;
    };
  }>({
    queryKey: ['/api/admin/seo/crawl-errors', page],
    queryFn: () =>
      authenticatedFetch(`/api/admin/seo/crawl-errors?page=${page}&limit=10`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchAnalytics(
  startDate: string,
  endDate: string,
  type: 'queries' | 'pages'
) {
  return useQuery<{
    success: boolean;
    data: {
      type: string;
      startDate: string;
      endDate: string;
      items: SearchAnalyticsItem[];
    };
  }>({
    queryKey: ['/api/admin/seo/search-analytics', startDate, endDate, type],
    queryFn: () =>
      authenticatedFetch(
        `/api/admin/seo/search-analytics?startDate=${startDate}&endDate=${endDate}&type=${type}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeoAlerts(page: number = 1) {
  return useQuery<{
    success: boolean;
    data: {
      alerts: SeoAlert[];
      pagination: Pagination;
    };
  }>({
    queryKey: ['/api/admin/seo/alerts', page],
    queryFn: () => authenticatedFetch(`/api/admin/seo/alerts?page=${page}&limit=10`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestIndexing() {
  const queryClient = useQueryClient();

  return useMutation<
    {
      success: boolean;
      data: {
        results: Array<{ url: string; success: boolean; message?: string }>;
        summary: { total: number; successful: number; failed: number };
      };
    },
    Error,
    { urls: string[] }
  >({
    mutationFn: async ({ urls }) => {
      const response = await fetch('/api/admin/seo/request-indexing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ urls }),
      });
      if (!response.ok) throw new Error('Failed to request indexing');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/crawl-errors'] });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { alertId: string }>({
    mutationFn: async ({ alertId }) => {
      const response = await fetch(`/api/admin/seo/alerts/${alertId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) throw new Error('Failed to dismiss alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/metrics/summary'] });
    },
  });
}

export function useSyncData() {
  const queryClient = useQueryClient();

  return useMutation<{
    success: boolean;
    message: string;
    data: {
      indexedPages: number;
      crawlErrors: number;
      totalClicks: number;
      averagePosition: number;
      syncedAt: string;
    };
  }>({
    mutationFn: async () => {
      const response = await fetch('/api/admin/seo/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) throw new Error('Failed to sync data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo'] });
    },
  });
}

// Helper
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
