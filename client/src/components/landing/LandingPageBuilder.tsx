import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { EmergencyHero } from "./EmergencyHero";
import { ServiceHero } from "./ServiceHero";
import { SeasonalHero } from "./SeasonalHero";
import { LocationHero } from "./LocationHero";
import { TrustBadges } from "./TrustBadges";
import { SocialProofBar } from "./SocialProofBar";
import { GuaranteeSection } from "./GuaranteeSection";
import { TeamShowcase } from "./TeamShowcase";
import { FloatingCTA } from "./FloatingCTA";
import { ExitIntentPopup } from "./ExitIntentPopup";
import { LimitedTimeOffer } from "./LimitedTimeOffer";
import { PricingCalculator } from "./PricingCalculator";
import { UrgencyIndicator } from "./UrgencyIndicator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import BookingModal from "@/components/BookingModal";
import ServiceAreaSection from "@/components/ServiceAreaSection";
import ReviewsSection from "@/components/ReviewsSection";
import ServicesSection from "@/components/ServicesSection";
import { Separator } from "@/components/ui/separator";
import { trackEvent, trackPageView, trackConversion, trackBookingEvent } from "@/lib/analytics";
import { getLandingPageByPath } from "@/config/landingPages";

type HeroType = 'emergency' | 'service' | 'seasonal' | 'location';
type TrustModule = 'badges' | 'socialProof' | 'guarantees' | 'team';
type ConversionModule = 'floatingCTA' | 'exitIntent' | 'limitedTime' | 'pricing' | 'urgency';

export interface LandingPageConfig {
  // Page Meta
  title: string;
  description: string;
  keywords?: string[];

  // Hero Configuration
  hero: {
    type: HeroType;
    props?: any;
  };

  // Trust Building Modules (order matters)
  trustModules?: Array<{
    type: TrustModule;
    props?: any;
  }>;

  // Conversion Modules
  conversionModules?: Array<{
    type: ConversionModule;
    props?: any;
  }>;

  // Additional Sections
  sections?: Array<
    'services' |
    'reviews' |
    'serviceAreas' |
    'testimonials' |
    'faq' |
    'blog'
  >;

  // A/B Testing
  variant?: 'A' | 'B';
  featureFlags?: {
    showExitIntent?: boolean;
    showFloatingCTA?: boolean;
    showUrgencyIndicators?: boolean;
    autoOpenBookingDelay?: number;
  };

  // Analytics
  trackingId?: string;
  conversionGoal?: string;
}

interface LandingPageBuilderProps {
  config: LandingPageConfig;
  onBookService?: () => void;
}

export function LandingPageBuilder({
  config,
  onBookService: customBookHandler
}: LandingPageBuilderProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const scriptRef = useRef<HTMLScriptElement>(null);
  const pageLoadTime = useRef(Date.now());
  const hasTrackedScroll = useRef(false);
  const [location] = useLocation();

  // Get landing page metadata from registry
  const landingPageMeta = getLandingPageByPath(location);

  // Default feature flags
  const featureFlags = {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true,
    autoOpenBookingDelay: 0,
    ...config.featureFlags
  };

  // Parse UTM parameters from URL
  const getUtmParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'none',
      utm_campaign: params.get('utm_campaign') || 'none',
      utm_content: params.get('utm_content') || undefined,
      utm_term: params.get('utm_term') || undefined,
      gclid: params.get('gclid') || undefined, // Google Ads click ID
      fbclid: params.get('fbclid') || undefined, // Meta click ID
    };
  }, []);

  // Track landing page view on mount
  useEffect(() => {
    const utmParams = getUtmParams();

    // Track page view with landing page context
    trackPageView(location, config.title);

    // Track landing page specific event with full context
    trackEvent('landing_page_view', {
      event_category: 'Landing Page',
      page_id: landingPageMeta?.id || config.trackingId || location,
      page_name: landingPageMeta?.name || config.title,
      page_path: location,
      conversion_goal: config.conversionGoal,
      variant: config.variant || 'default',
      ...utmParams,
    });

    // Store session data for attribution
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('landing_page', JSON.stringify({
        id: landingPageMeta?.id || config.trackingId,
        path: location,
        variant: config.variant,
        conversionGoal: config.conversionGoal,
        entryTime: new Date().toISOString(),
        utmParams,
      }));
    }
  }, [location, config.title, config.trackingId, config.conversionGoal, config.variant, landingPageMeta, getUtmParams]);

  // Track scroll depth (25%, 50%, 75%, 100%)
  useEffect(() => {
    const trackScrollDepth = () => {
      if (hasTrackedScroll.current) return;

      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone) {
          trackEvent('scroll_depth', {
            event_category: 'Engagement',
            page_id: landingPageMeta?.id || config.trackingId,
            scroll_depth: milestone,
            variant: config.variant,
          });
        }
      }

      if (scrollPercent >= 100) {
        hasTrackedScroll.current = true;
      }
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    return () => window.removeEventListener('scroll', trackScrollDepth);
  }, [landingPageMeta, config.trackingId, config.variant]);

  // Track time on page when user leaves
  useEffect(() => {
    const trackTimeOnPage = () => {
      const timeOnPage = Math.round((Date.now() - pageLoadTime.current) / 1000);
      trackEvent('time_on_page', {
        event_category: 'Engagement',
        page_id: landingPageMeta?.id || config.trackingId,
        time_seconds: timeOnPage,
        variant: config.variant,
      });
    };

    window.addEventListener('beforeunload', trackTimeOnPage);
    return () => window.removeEventListener('beforeunload', trackTimeOnPage);
  }, [landingPageMeta, config.trackingId, config.variant]);

  // Handle booking with tracking
  const handleBookService = useCallback(() => {
    // Track CTA click
    trackEvent('cta_click', {
      event_category: 'Conversion',
      page_id: landingPageMeta?.id || config.trackingId,
      cta_text: landingPageMeta?.primaryCTA || 'Book Service',
      conversion_goal: config.conversionGoal,
      variant: config.variant,
    });

    // Track booking started
    trackBookingEvent('started', {
      serviceType: config.hero.props?.serviceName || 'general',
    });

    if (customBookHandler) {
      customBookHandler();
    } else {
      setIsBookingModalOpen(true);
    }
  }, [customBookHandler, landingPageMeta, config.trackingId, config.conversionGoal, config.variant, config.hero.props?.serviceName]);

  // Track booking modal close (potential abandonment)
  const handleBookingModalClose = useCallback(() => {
    trackBookingEvent('abandoned', {
      serviceType: config.hero.props?.serviceName || 'general',
    });
    setIsBookingModalOpen(false);
  }, [config.hero.props?.serviceName]);

  // Auto-open booking modal after delay
  useEffect(() => {
    if (featureFlags.autoOpenBookingDelay && featureFlags.autoOpenBookingDelay > 0) {
      const timer = setTimeout(() => {
        setIsBookingModalOpen(true);
      }, featureFlags.autoOpenBookingDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [featureFlags.autoOpenBookingDelay]);

  // Enable exit intent after delay
  useEffect(() => {
    if (featureFlags.showExitIntent) {
      const timer = setTimeout(() => {
        setShowExitIntent(true);
      }, 10000); // Show after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [featureFlags.showExitIntent]);

  // Inject analytics tracking script safely
  useEffect(() => {
    if (config.variant && scriptRef.current) {
      try {
        // Validate and sanitize config values
        const variant = String(config.variant || 'default').slice(0, 50); // Max 50 chars, only string
        const conversionGoal = String(config.conversionGoal || 'booking').slice(0, 100); // Max 100 chars
        const trackingId = config.trackingId ? String(config.trackingId).slice(0, 100) : null; // Max 100 chars

        // Only allow alphanumeric, hyphens, and underscores
        if (!/^[a-zA-Z0-9_-]+$/.test(variant)) {
          console.warn('Invalid landing page variant value');
          return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(conversionGoal)) {
          console.warn('Invalid conversion goal value');
          return;
        }
        if (trackingId && !/^[a-zA-Z0-9_-]+$/.test(trackingId)) {
          console.warn('Invalid tracking ID value');
          return;
        }

        // Build script content safely without template literals
        let scriptContent = 'window.landingPageVariant = ' + JSON.stringify(variant) + ';';
        scriptContent += '\nwindow.conversionGoal = ' + JSON.stringify(conversionGoal) + ';';
        if (trackingId) {
          scriptContent += '\nwindow.trackingId = ' + JSON.stringify(trackingId) + ';';
        }

        scriptRef.current.textContent = scriptContent;
      } catch (error) {
        console.error('Failed to inject analytics tracking:', error);
      }
    }
  }, [config.variant, config.conversionGoal, config.trackingId]);

  // Render Hero based on type
  const renderHero = () => {
    const { type, props = {} } = config.hero;

    switch (type) {
      case 'emergency':
        return <EmergencyHero onBookService={handleBookService} {...props} />;
      case 'service':
        return <ServiceHero onBookService={handleBookService} {...props} />;
      case 'seasonal':
        return <SeasonalHero onBookService={handleBookService} {...props} />;
      case 'location':
        return <LocationHero onBookService={handleBookService} {...props} />;
      default:
        return null;
    }
  };

  // Render Trust Modules
  const renderTrustModules = () => {
    if (!config.trustModules) return null;

    return config.trustModules.map((module, index) => {
      const { type, props = {} } = module;

      switch (type) {
        case 'badges':
          return <TrustBadges key={`trust-${index}`} {...props} />;
        case 'socialProof':
          return <SocialProofBar key={`trust-${index}`} position="inline" {...props} />;
        case 'guarantees':
          return <GuaranteeSection key={`trust-${index}`} {...props} />;
        case 'team':
          return <TeamShowcase key={`trust-${index}`} onBookWithTech={() => handleBookService()} {...props} />;
        default:
          return null;
      }
    });
  };

  // Render Conversion Modules
  const renderConversionModules = () => {
    if (!config.conversionModules) return null;

    return config.conversionModules.map((module, index) => {
      const { type, props = {} } = module;

      switch (type) {
        case 'floatingCTA':
          return featureFlags.showFloatingCTA ? (
            <FloatingCTA key={`conv-${index}`} onBookService={handleBookService} {...props} />
          ) : null;
        case 'exitIntent':
          return featureFlags.showExitIntent && showExitIntent ? (
            <ExitIntentPopup key={`conv-${index}`} onBookService={handleBookService} {...props} />
          ) : null;
        case 'limitedTime':
          return <LimitedTimeOffer key={`conv-${index}`} onBookService={handleBookService} {...props} />;
        case 'pricing':
          return <PricingCalculator key={`conv-${index}`} onBookService={handleBookService} {...props} />;
        case 'urgency':
          return featureFlags.showUrgencyIndicators ? (
            <div key={`conv-${index}`} className="container mx-auto px-4 py-8">
              <UrgencyIndicator {...props} />
            </div>
          ) : null;
        default:
          return null;
      }
    });
  };

  // Render Additional Sections
  const renderSections = () => {
    if (!config.sections) return null;

    return config.sections.map((section, index) => {
      switch (section) {
        case 'services':
          return (
            <div key={`section-${index}`}>
              <ServicesSection onBookService={handleBookService} />
              <Separator />
            </div>
          );
        case 'reviews':
          return (
            <div key={`section-${index}`}>
              <ReviewsSection />
              <Separator />
            </div>
          );
        case 'serviceAreas':
          return (
            <div key={`section-${index}`}>
              <ServiceAreaSection />
              <Separator />
            </div>
          );
        default:
          return null;
      }
    });
  };

  return (
    <>
      <SEO
        title={config.title}
        description={config.description}
        keywords={config.keywords}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Social Proof Bar - Top */}
        {config.trustModules?.some(m => m.type === 'socialProof' && m.props?.position === 'top') && (
          <SocialProofBar position="top" />
        )}

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          {renderHero()}

          {/* Urgency Indicator - After Hero */}
          {featureFlags.showUrgencyIndicators && config.conversionModules?.some(m => m.type === 'urgency' && m.props?.position === 'banner') && (
            <UrgencyIndicator type="combined" position="banner" />
          )}

          {/* Trust Building Modules */}
          {renderTrustModules()}

          {/* Conversion Modules (non-floating) */}
          {config.conversionModules?.filter(m => m.type !== 'floatingCTA' && m.type !== 'exitIntent').map((module, index) => {
            const { type, props = {} } = module;

            if (type === 'limitedTime') {
              return <LimitedTimeOffer key={`conv-inline-${index}`} onBookService={handleBookService} {...props} />;
            }
            if (type === 'pricing') {
              return <PricingCalculator key={`conv-inline-${index}`} onBookService={handleBookService} {...props} />;
            }
            if (type === 'urgency' && props.position !== 'banner') {
              return (
                <div key={`conv-inline-${index}`} className="container mx-auto px-4 py-8">
                  <UrgencyIndicator {...props} />
                </div>
              );
            }
            return null;
          })}

          {/* Additional Sections */}
          {renderSections()}
        </main>

        <Footer />

        {/* Floating Conversion Modules */}
        {renderConversionModules()}

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleBookingModalClose}
        />
      </div>

      {/* A/B Testing Tracking - Safely injected without dangerouslySetInnerHTML */}
      {config.variant && (
        <script ref={scriptRef} type="text/javascript" />
      )}
    </>
  );
}