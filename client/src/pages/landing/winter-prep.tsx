import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const winterPrepConfig: LandingPageConfig = {
  title: "Winter Plumbing Protection Special | Prevent Frozen Pipes | Johnson Brothers",
  description: "Protect your home from frozen pipes this winter. Professional winterization service in Quincy, MA. Save 20% when you book today!",
  keywords: ["winterize plumbing", "frozen pipe prevention", "winter plumbing", "pipe insulation", "Quincy winter service"],
  
  hero: {
    type: 'seasonal',
    props: {
      season: 'winter',
      headline: "Winterize Your Plumbing Before It's Too Late",
      subheadline: "Protect your home from frozen pipes, burst damage, and costly emergency repairs",
      offerEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      discount: 20
    }
  },
  
  trustModules: [
    {
      type: 'socialProof',
      props: {
        position: 'inline',
        showViewers: true,
        showRecentJobs: true,
        animateJobs: true
      }
    },
    {
      type: 'team',
      props: {
        layout: 'grid',
        showStats: true,
        showContact: false
      }
    },
    {
      type: 'badges',
      props: {
        layout: 'grid',
        showVerification: true
      }
    },
    {
      type: 'guarantees',
      props: {
        layout: 'stacked',
        guarantees: [
          {
            icon: "Snowflake",
            title: "Freeze Protection Guarantee",
            description: "If any pipe we winterize freezes this winter, we'll fix it free",
            highlight: "Full winter coverage"
          },
          {
            icon: "Shield",
            title: "Complete Home Protection",
            description: "We check and protect all vulnerable pipes and fixtures",
            highlight: "Comprehensive service"
          },
          {
            icon: "Clock",
            title: "Fast Service Before Cold Snap",
            description: "Priority scheduling to protect your home before temperatures drop",
            highlight: "Beat the freeze"
          }
        ]
      }
    }
  ],
  
  conversionModules: [
    {
      type: 'limitedTime',
      props: {
        offerTitle: "Winter Special: 20% Off Winterization",
        offerDescription: "Limited spots available before the cold snap hits. Book your winterization service now and save!",
        discount: {
          type: 'percentage',
          value: 20
        },
        showProgress: true,
        spotsAvailable: 12,
        totalSpots: 30,
        urgencyLevel: 'high'
      }
    },
    {
      type: 'urgency',
      props: {
        type: 'demand',
        position: 'inline'
      }
    },
    {
      type: 'pricing',
      props: {
        showComparison: false,
        services: [
          { 
            id: 'basic', 
            name: 'Basic Winterization', 
            basePrice: 199, 
            description: 'Essential freeze protection',
            popular: false
          },
          { 
            id: 'standard', 
            name: 'Complete Winterization', 
            basePrice: 349, 
            description: 'Full home protection package',
            popular: true
          },
          { 
            id: 'premium', 
            name: 'Premium Protection', 
            basePrice: 499, 
            description: 'Winterization + emergency kit'
          },
        ],
        addons: [
          { id: 'heatcable', name: 'Heat Cable Installation', price: 79, description: 'For exposed pipes' },
          { id: 'faucetcovers', name: 'Outdoor Faucet Covers', price: 29, description: 'Set of 4 covers' },
          { id: 'emergency', name: 'Emergency Shutoff Training', price: 0, description: 'FREE with service' },
        ]
      }
    },
    {
      type: 'floatingCTA',
      props: {
        position: 'bottom-right',
        style: 'expanded',
        primaryAction: {
          text: "Winterize Now - Save 20%",
          highlight: true
        }
      }
    },
    {
      type: 'exitIntent',
      props: {
        triggerDelay: 1000,
        offer: {
          type: 'discount',
          value: '25%',
          headline: "WAIT! Extra 5% Off Today Only",
          description: "Book now and get 25% off winterization (normally 20%)"
        },
        showEmailCapture: true
      }
    }
  ],
  
  sections: ['services', 'reviews', 'serviceAreas'],
  
  featureFlags: {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true,
    autoOpenBookingDelay: 0
  },
  
  variant: 'A',
  conversionGoal: 'winter-prep-booking'
};

export default function WinterPrepLandingPage() {
  return <LandingPageBuilder config={winterPrepConfig} />;
}