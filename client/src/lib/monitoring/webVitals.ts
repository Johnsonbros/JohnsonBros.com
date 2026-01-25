import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { sentryClient } from './sentry';


export interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

interface PerformanceBudget {
  LCP: { good: number; poor: number };
  INP: { good: number; poor: number };
  CLS: { good: number; poor: number };
  FCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

class WebVitalsMonitor {
  private static instance: WebVitalsMonitor;
  private metrics: Map<string, VitalMetric> = new Map();
  private reportCallback?: (metrics: VitalMetric[]) => void;
  private analyticsCallback?: (metric: VitalMetric) => void;
  private initialized = false;

  // Performance budgets (in milliseconds for time metrics, score for CLS)
  private readonly performanceBudget: PerformanceBudget = {
    LCP: { good: 2500, poor: 4000 },   // Largest Contentful Paint
    INP: { good: 200, poor: 500 },      // Interaction to Next Paint (replaced FID)
    CLS: { good: 0.1, poor: 0.25 },     // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 },    // First Contentful Paint
    TTFB: { good: 800, poor: 1800 },    // Time to First Byte
  };

  private constructor() {}

  static getInstance(): WebVitalsMonitor {
    if (!WebVitalsMonitor.instance) {
      WebVitalsMonitor.instance = new WebVitalsMonitor();
    }
    return WebVitalsMonitor.instance;
  }

  initialize(options?: {
    reportCallback?: (metrics: VitalMetric[]) => void;
    analyticsCallback?: (metric: VitalMetric) => void;
    enableSentryReporting?: boolean;
  }) {
    if (this.initialized) return;

    this.reportCallback = options?.reportCallback;
    this.analyticsCallback = options?.analyticsCallback;

    // Set up Web Vitals monitoring
    const reportHandler = (metric: Metric) => {
      const vitalMetric = this.processMetric(metric);
      this.metrics.set(metric.name, vitalMetric);

      // Send to analytics if callback provided
      if (this.analyticsCallback) {
        this.analyticsCallback(vitalMetric);
      }

      // Report to Sentry if enabled
      if (options?.enableSentryReporting !== false) {
        this.reportToSentry(vitalMetric);
      }

      // Check performance budget
      this.checkPerformanceBudget(vitalMetric);
    };

    // Register all Web Vitals
    onCLS(reportHandler);
    onFCP(reportHandler);
    onINP(reportHandler);
    onLCP(reportHandler);
    onTTFB(reportHandler);

    // Also monitor additional performance metrics
    this.monitorAdditionalMetrics();

    this.initialized = true;
    console.log('[WebVitals] Monitoring initialized');
  }

  private processMetric(metric: Metric): VitalMetric {
    const budget = this.performanceBudget[metric.name as keyof PerformanceBudget];
    let rating: 'good' | 'needs-improvement' | 'poor' = 'good';

    if (budget) {
      if (metric.value >= budget.poor) {
        rating = 'poor';
      } else if (metric.value >= budget.good) {
        rating = 'needs-improvement';
      }
    }

    return {
      name: metric.name,
      value: Math.round(metric.value),
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate',
      timestamp: Date.now(),
    };
  }

  private reportToSentry(metric: VitalMetric) {
    sentryClient.addBreadcrumb({
      message: `Web Vital: ${metric.name}`,
      category: 'web-vitals',
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
      },
    });

    // Report poor performance as a message to Sentry
    if (metric.rating === 'poor') {
      sentryClient.captureMessage(
        `Poor ${metric.name} performance: ${metric.value}ms`,
        'warning',
        {
          metric: metric.name,
          value: metric.value,
          threshold: this.performanceBudget[metric.name as keyof PerformanceBudget]?.poor,
        }
      );
    }
  }

  private checkPerformanceBudget(metric: VitalMetric) {
    const budget = this.performanceBudget[metric.name as keyof PerformanceBudget];
    if (!budget) return;

    if (metric.rating === 'poor') {
      console.warn(
        `[Performance Budget] ${metric.name} exceeded threshold:`,
        `${metric.value}ms (threshold: ${budget.poor}ms)`
      );

      // You could trigger alerts here or send to monitoring service
      this.sendPerformanceAlert(metric, budget.poor);
    }
  }

  private sendPerformanceAlert(metric: VitalMetric, threshold: number) {
    // Send to backend monitoring endpoint
    fetch('/api/v1/monitoring/performance-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        threshold,
        rating: metric.rating,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: metric.timestamp,
      }),
    }).catch((err) => console.error('[Performance Alert] Failed to send:', err));
  }

  private monitorAdditionalMetrics() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Task took longer than 50ms
              console.warn('[Long Task]', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });

              sentryClient.addBreadcrumb({
                message: 'Long Task Detected',
                category: 'performance',
                level: 'warning',
                data: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                },
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('[WebVitals] Long task monitoring not supported');
      }
    }

    // Monitor resource timing
    this.monitorResourceTiming();
  }

  private monitorResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track slow resources
            if (resourceEntry.duration > 1000) {
              console.warn('[Slow Resource]', {
                name: resourceEntry.name,
                duration: resourceEntry.duration,
                type: resourceEntry.initiatorType,
              });
            }

            // Track API calls (excluding analytics endpoints to prevent feedback loop)
            if (resourceEntry.name.includes('/api/') &&
                !resourceEntry.name.includes('/api/v1/analytics/') &&
                !resourceEntry.name.includes('/api/v1/monitoring/')) {
              this.trackAPIPerformance(resourceEntry);
            }
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.log('[WebVitals] Resource timing monitoring not supported');
    }
  }

  private trackAPIPerformance(entry: PerformanceResourceTiming) {
    const apiPath = new URL(entry.name).pathname;
    const duration = Math.round(entry.duration);

    // Track slow API calls
    if (duration > 2000) {
      sentryClient.captureMessage(
        `Slow API call: ${apiPath}`,
        'warning',
        {
          api: apiPath,
          duration,
          method: entry.initiatorType,
        }
      );
    }

    // Send to analytics
    if (this.analyticsCallback) {
      this.analyticsCallback({
        name: 'API_LATENCY',
        value: duration,
        rating: duration < 500 ? 'good' : duration < 2000 ? 'needs-improvement' : 'poor',
        delta: 0,
        id: `api-${Date.now()}`,
        navigationType: 'api-call',
        timestamp: Date.now(),
      });
    }
  }

  // Get current metrics
  getMetrics(): VitalMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get specific metric
  getMetric(name: string): VitalMetric | undefined {
    return this.metrics.get(name);
  }

  // Report all metrics
  reportMetrics() {
    if (this.reportCallback) {
      this.reportCallback(this.getMetrics());
    }
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 100;

    let totalScore = 0;
    let weightSum = 0;

    // Weights for different metrics
    const weights = {
      LCP: 0.25,
      INP: 0.25,
      CLS: 0.25,
      FCP: 0.15,
      TTFB: 0.1,
    };

    for (const metric of metrics) {
      const weight = weights[metric.name as keyof typeof weights] || 0;
      if (weight > 0) {
        let score = 100;
        if (metric.rating === 'needs-improvement') score = 50;
        if (metric.rating === 'poor') score = 0;
        
        totalScore += score * weight;
        weightSum += weight;
      }
    }

    return weightSum > 0 ? Math.round(totalScore / weightSum) : 100;
  }
}

export const webVitalsMonitor = WebVitalsMonitor.getInstance();

// Dedupe/throttle state for sendToAnalytics
const sentMetrics = new Map<string, { timestamp: number; value: number }>();
const METRIC_THROTTLE_MS = 5000; // Don't resend same metric within 5 seconds
const VALUE_CHANGE_THRESHOLD = 0.05; // 5% change required to resend

// Sampling: only send vitals for a percentage of sessions
// Default: 10% in dev, 100% in prod (configurable via VITE_WEB_VITALS_SAMPLE_RATE)
const DEFAULT_SAMPLE_RATE = import.meta.env.DEV ? 0.1 : 1.0;
const SAMPLE_RATE = parseFloat(import.meta.env.VITE_WEB_VITALS_SAMPLE_RATE || String(DEFAULT_SAMPLE_RATE));
const SESSION_SAMPLED = Math.random() < SAMPLE_RATE;

// Helper function to send metrics to analytics (with dedupe + sampling)
export function sendToAnalytics(metric: VitalMetric) {
  // Sampling: skip sending if this session is not sampled
  if (!SESSION_SAMPLED) {
    return;
  }

  // Build a stable key for deduplication
  const key = `${metric.name}:${metric.id || ''}:${metric.navigationType || ''}`;
  const now = Date.now();
  const previous = sentMetrics.get(key);

  // Check if we should skip this metric
  if (previous) {
    const timeSinceLastSend = now - previous.timestamp;
    const valueChangeRatio = Math.abs(metric.value - previous.value) / (previous.value || 1);

    // Skip if: sent recently AND value hasn't changed significantly
    if (timeSinceLastSend < METRIC_THROTTLE_MS && valueChangeRatio < VALUE_CHANGE_THRESHOLD) {
      if (import.meta.env.DEV) {
        console.log(`[WebVitals] Skipping duplicate metric: ${key} (sent ${timeSinceLastSend}ms ago)`);
      }
      return;
    }
  }

  // Record this send
  sentMetrics.set(key, { timestamp: now, value: metric.value });

  // Prevent memory leak: clean up old entries (keep last 50)
  if (sentMetrics.size > 50) {
    const entries = Array.from(sentMetrics.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < entries.length - 50; i++) {
      sentMetrics.delete(entries[i][0]);
    }
  }

  // Google Analytics implementation
  if (window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }

  // Use sendBeacon for reliability during page unload, fall back to fetch
  const data = JSON.stringify(metric);

  if (navigator.sendBeacon) {
    // sendBeacon is more reliable for analytics during page unload
    const blob = new Blob([data], { type: 'application/json' });
    navigator.sendBeacon('/api/v1/analytics/web-vitals', blob);
  } else {
    // Fallback to fetch with keepalive for older browsers
    fetch('/api/v1/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true, // Allows request to complete even if page is unloading
    }).catch(() => {
      // Silently fail - analytics should not disrupt user experience
    });
  }
}