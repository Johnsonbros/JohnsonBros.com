import { useState, useEffect } from "react";
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

  // Default feature flags
  const featureFlags = {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true,
    autoOpenBookingDelay: 0,
    ...config.featureFlags
  };

  // Handle booking
  const handleBookService = () => {
    if (customBookHandler) {
      customBookHandler();
    } else {
      setIsBookingModalOpen(true);
    }
  };

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
        keywords={config.keywords?.join(', ')}
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
          onClose={() => setIsBookingModalOpen(false)}
        />
      </div>
      
      {/* A/B Testing Tracking */}
      {config.variant && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.landingPageVariant = '${config.variant}';
              window.conversionGoal = '${config.conversionGoal || 'booking'}';
              ${config.trackingId ? `window.trackingId = '${config.trackingId}';` : ''}
            `
          }}
        />
      )}
    </>
  );
}