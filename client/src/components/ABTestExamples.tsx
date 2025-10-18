import { useABTest, ABTestButton, ABTestText } from '@/hooks/use-abtest';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

// Example 1: Testing CTA Button Text
export function TestableBookingButton({ onBook }: { onBook: () => void }) {
  const { variant, trackConversion, trackClick } = useABTest('booking_cta_text');

  const handleClick = () => {
    trackClick();
    onBook();
    trackConversion('booking_initiated');
  };

  // Use the variant's button text or default
  const buttonText = variant?.changes?.buttonText || 'Book Now';
  const urgencyText = variant?.changes?.urgencyText;

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleClick}
        className="w-full bg-johnson-orange hover:bg-johnson-orange-dark"
        data-testid={`button-cta-${variant?.id}`}
      >
        {buttonText}
      </Button>
      {urgencyText && (
        <p className="text-sm text-gray-600 text-center">{urgencyText}</p>
      )}
    </div>
  );
}

// Example 2: Testing Hero Headlines
export function TestableHeroSection() {
  const { variant, trackView } = useABTest('hero_headline');

  useEffect(() => {
    trackView();
  }, [trackView]);

  const headline = variant?.changes?.headline || 'Professional Plumbing Services';
  const subheadline = variant?.changes?.subheadline || 'Reliable & Affordable Solutions for Your Home';

  return (
    <div className="hero-section py-16 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid={`hero-headline-${variant?.id}`}>
        {headline}
      </h1>
      <p className="text-xl text-gray-600" data-testid={`hero-subheadline-${variant?.id}`}>
        {subheadline}
      </p>
    </div>
  );
}

// Example 3: Testing Pricing Display
export function TestablePricingCard({ plan }: { plan: any }) {
  const { variant, trackEngagement, trackConversion } = useABTest('pricing_display');

  const showStartingPrice = variant?.changes?.showStartingPrice ?? true;
  const showSavings = variant?.changes?.showSavings ?? false;
  const showMonthlyBreakdown = variant?.changes?.showMonthlyBreakdown ?? false;

  const handleSelect = () => {
    trackEngagement('plan_selected', { planId: plan.id });
    trackConversion('plan_signup', plan.price);
  };

  return (
    <div className="pricing-card border rounded-lg p-6" data-testid={`pricing-card-${variant?.id}`}>
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      
      {showStartingPrice && (
        <div className="mb-4">
          <span className="text-3xl font-bold">${plan.price}</span>
          {showMonthlyBreakdown && (
            <span className="text-sm text-gray-600">/month</span>
          )}
        </div>
      )}
      
      {showSavings && plan.savings && (
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md inline-block mb-4">
          Save ${plan.savings} annually
        </div>
      )}
      
      <Button onClick={handleSelect} className="w-full">
        Select Plan
      </Button>
    </div>
  );
}

// Example 4: Testing Urgency Messages
export function TestableUrgencyBanner() {
  const { variant, trackView, trackEngagement } = useABTest('urgency_messaging');

  useEffect(() => {
    if (variant?.changes?.showUrgency) {
      trackView();
    }
  }, [variant, trackView]);

  if (!variant?.changes?.showUrgency) {
    return null;
  }

  const message = variant.changes.urgencyMessage || '';
  const showLimitedSlots = variant.changes.showLimitedSlots;
  
  // Replace placeholders with actual values
  const formattedMessage = message
    .replace('{slots}', '3')
    .replace('{time}', '2 hours');

  return (
    <div 
      className="bg-red-50 border-l-4 border-red-500 p-4 mb-4"
      onClick={() => trackEngagement('urgency_click')}
      data-testid={`urgency-banner-${variant?.id}`}
    >
      <p className="font-semibold text-red-900">{formattedMessage}</p>
      {showLimitedSlots && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <span className="text-sm text-red-700">75% booked</span>
        </div>
      )}
    </div>
  );
}

// Example 5: Testing Trust Badge Placement
export function TestableTrustBadges() {
  const { variant, trackView, trackEngagement } = useABTest('trust_badges');

  useEffect(() => {
    trackView();
  }, [trackView]);

  const badges = [
    { id: 'licensed', text: 'Licensed & Insured', icon: '✓' },
    { id: 'reviews', text: '4.9★ (487 Reviews)', icon: '★' },
    { id: 'guarantee', text: '100% Guarantee', icon: '🛡️' },
    { id: 'years', text: '25+ Years', icon: '📅' }
  ];

  const showInHeader = variant?.changes?.headerBadges;
  const showInHero = variant?.changes?.heroBadges;
  const showInFooter = variant?.changes?.footerBadges;
  const showFloating = variant?.changes?.floatingBadges;

  const handleBadgeClick = (badgeId: string) => {
    trackEngagement('trust_badge_click', { badge: badgeId });
  };

  const BadgeGroup = ({ className = '' }) => (
    <div className={`flex flex-wrap gap-4 ${className}`} data-testid={`trust-badges-${variant?.id}`}>
      {badges.map(badge => (
        <div
          key={badge.id}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleBadgeClick(badge.id)}
        >
          <span className="text-green-600">{badge.icon}</span>
          <span className="text-sm font-medium">{badge.text}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {showInHeader && <BadgeGroup className="justify-center" />}
      {showInHero && <BadgeGroup className="justify-center mt-4" />}
      {showInFooter && <BadgeGroup className="justify-center" />}
      {showFloating && (
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="space-y-2">
            {badges.slice(0, 2).map(badge => (
              <div
                key={badge.id}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleBadgeClick(badge.id)}
              >
                <span className="text-green-600">{badge.icon}</span>
                <span className="text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Example 6: Using the simplified ABTestButton component
export function SimpleTestExample() {
  return (
    <div className="space-y-4">
      {/* Simplified button test */}
      <ABTestButton
        testId="booking_cta_text"
        defaultText="Book Service"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        onConversion={() => console.log('Booking started')}
      />

      {/* Simplified text test */}
      <ABTestText
        testId="hero_headline"
        field="headline"
        defaultValue="Welcome to Our Service"
        as="h1"
        className="text-3xl font-bold"
      />
    </div>
  );
}

// Documentation example showing how to add a new test
export const ADD_NEW_TEST_EXAMPLE = `
// Step 1: Define your test in client/src/lib/abTesting.ts
const newTest: ABTest = {
  id: 'my_new_test',
  name: 'My New Test',
  description: 'Testing a new feature',
  status: 'active',
  trafficAllocation: 1.0,
  variants: [
    {
      id: 'control',
      name: 'Control',
      weight: 50,
      isControl: true,
      changes: { feature: 'old' }
    },
    {
      id: 'variant',
      name: 'Variant',
      weight: 50,
      changes: { feature: 'new' }
    }
  ]
};

// Step 2: Use the test in your component
function MyComponent() {
  const { variant, trackConversion } = useABTest('my_new_test');
  
  if (variant?.changes?.feature === 'new') {
    return <NewFeature onComplete={() => trackConversion('feature_used')} />;
  }
  
  return <OldFeature />;
}
`;