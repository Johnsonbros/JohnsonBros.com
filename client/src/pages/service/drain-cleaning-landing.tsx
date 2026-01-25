import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const drainCleaningConfig: LandingPageConfig = {
  title: "Expert Drain Cleaning Service in Quincy MA | Fast Clog Removal $99 Special",
  description: "Professional drain cleaning and clog removal in Quincy, Weymouth, and South Shore MA. Same-day service, video inspection included. Clear any drain for just $149. Call (617) 479-9911 now!",
  keywords: ["drain cleaning Quincy MA", "clogged drain repair", "slow drain fix", "sewer cleaning", "emergency drain service", "hydro jetting", "drain snake service", "kitchen sink clog", "toilet backup", "main line cleaning"],
  
  hero: {
    type: 'service',
    props: {
      serviceName: "Professional Drain Cleaning",
      headline: "Clogged Drain? We'll Clear It Fast!",
      subheadline: "Expert drain cleaning with video inspection included. Same-day service available with our $99 service fee waived promotion!",
      price: "$149",
      features: [
        "Video camera inspection included FREE",
        "All drains cleared - kitchen, bathroom, main",
        "Hydro jetting for tough clogs",
        "90-day clear drain guarantee"
      ],
      beforeImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2000",
      afterImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2000",
      rating: 4.9,
      reviewCount: 428
    }
  },
  
  trustModules: [
    {
      type: 'badges',
      props: {
        layout: 'horizontal',
        showVerification: true
      }
    },
    {
      type: 'socialProof',
      props: {
        stats: [
          { label: "Drains Cleared", value: "5,847", icon: "Droplets" },
          { label: "Response Time", value: "<2 Hours", icon: "Clock" },
          { label: "Happy Customers", value: "2,400+", icon: "Users" },
          { label: "Years Experience", value: "27", icon: "Award" }
        ]
      }
    },
    {
      type: 'guarantees',
      props: {
        layout: 'grid',
        showSeal: true,
        guarantees: [
          {
            icon: "Shield",
            title: "90-Day Clear Guarantee",
            description: "If your drain clogs again within 90 days, we'll clear it free",
            highlight: "No questions asked"
          },
          {
            icon: "Clock",
            title: "Same-Day Service",
            description: "Book before 2 PM for same-day drain cleaning",
            highlight: "Fast response guaranteed"
          },
          {
            icon: "DollarSign",
            title: "Flat Rate Pricing",
            description: "One price for any residential drain - no surprises",
            highlight: "Price locked at $149"
          },
          {
            icon: "CheckCircle",
            title: "100% Satisfaction",
            description: "We're not done until your drains flow perfectly",
            highlight: "Guaranteed results"
          }
        ]
      }
    }
  ],
  
  conversionModules: [
    {
      type: 'pricing',
      props: {
        showComparison: true,
        services: [
          { 
            id: 'basic', 
            name: 'Single Drain Cleaning', 
            basePrice: 149, 
            description: 'Kitchen sink, bathroom drain, or toilet',
            features: ['Snake or auger service', 'Video inspection', '90-day guarantee']
          },
          { 
            id: 'multiple', 
            name: 'Multiple Drains Special', 
            basePrice: 249, 
            description: 'Save $50 when you clear 2+ drains',
            features: ['All drain types', 'Full inspection', 'Extended warranty'],
            highlighted: true
          },
          { 
            id: 'main', 
            name: 'Main Sewer Line', 
            basePrice: 399, 
            description: 'Full sewer line cleaning and inspection',
            features: ['Hydro jetting available', 'Camera inspection', 'Root cutting if needed']
          },
          { 
            id: 'hydro', 
            name: 'Hydro Jetting Service', 
            basePrice: 599, 
            description: 'High-pressure cleaning for severe blockages',
            features: ['Removes all buildup', 'Prevents future clogs', '1-year guarantee']
          }
        ],
        addons: [
          { id: 'enzyme', name: 'Bio-Enzyme Treatment', price: 49, description: 'Monthly enzyme treatment to prevent clogs' },
          { id: 'locate', name: 'Line Location Service', price: 99, description: 'Locate and map your drain lines' },
          { id: 'warranty', name: 'Extended 1-Year Warranty', price: 89, description: 'Full coverage for 12 months' }
        ]
      }
    },
    {
      type: 'limitedTime',
      props: {
        offerTitle: "LIMITED TIME: $99 Service Fee Waived!",
        offerDescription: "Book online now and we'll waive the $99 service call fee - you only pay for the drain cleaning!",
        discount: {
          type: 'fixed',
          value: 99,
          originalPrice: 248
        },
        urgencyLevel: 'high',
        spotsAvailable: 3,
        totalSpots: 10
      }
    },
    {
      type: 'floatingCTA',
      props: {
        position: 'bottom-right',
        style: 'mobile',
        showBackToTop: true
      }
    },
    {
      type: 'urgency',
      props: {
        type: 'slots',
        position: 'inline'
      }
    }
  ],
  
  sections: ['reviews', 'services', 'serviceAreas'],
  
  featureFlags: {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true
  },
  
  variant: 'B',
  conversionGoal: 'drain-cleaning-booking'
};

export default function DrainCleaningLandingPage() {
  return <LandingPageBuilder config={drainCleaningConfig} />;
}