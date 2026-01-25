import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const drainCleaningConfig: LandingPageConfig = {
  title: "Professional Drain Cleaning Service | Johnson Brothers Plumbing",
  description: "Expert drain cleaning in Quincy, MA. Clear clogs, prevent backups. Same-day service, upfront pricing. Book online and save $50!",
  keywords: ["drain cleaning", "clogged drain", "drain unclogging", "sewer cleaning", "Quincy drain service"],
  
  hero: {
    type: 'service',
    props: {
      serviceName: "Drain Cleaning",
      headline: "Professional Drain Cleaning Service",
      subheadline: "Clear clogs fast, prevent future blockages, and keep your drains flowing smoothly",
      price: "$199",
      features: [
        "Video camera inspection included",
        "All drains & sewer lines",
        "Eco-friendly solutions",
        "90-day guarantee"
      ],
      beforeImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2000",
      afterImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2000",
      rating: 4.9,
      reviewCount: 312
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
      type: 'guarantees',
      props: {
        layout: 'centered',
        showSeal: true,
        guarantees: [
          {
            icon: "Shield",
            title: "90-Day Clear Drain Guarantee",
            description: "If your drain clogs again within 90 days, we'll clear it free",
            highlight: "No questions asked"
          },
          {
            icon: "Clock",
            title: "Same-Day Service",
            description: "Book before 2 PM for same-day drain cleaning",
            highlight: "Fast response"
          },
          {
            icon: "DollarSign",
            title: "Flat Rate Pricing",
            description: "$199 for most residential drains - no hidden fees",
            highlight: "Transparent pricing"
          },
          {
            icon: "Award",
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
          { id: 'kitchen', name: 'Kitchen Sink', basePrice: 149, description: 'Clear kitchen drain clogs' },
          { id: 'bathroom', name: 'Bathroom Drains', basePrice: 149, description: 'Tub, shower, or sink' },
          { id: 'main', name: 'Main Line', basePrice: 299, description: 'Sewer line cleaning' },
          { id: 'multiple', name: 'Multiple Drains', basePrice: 249, description: 'Save on 2+ drains' },
        ],
        addons: [
          { id: 'camera', name: 'Video Inspection', price: 99, description: 'See inside your pipes' },
          { id: 'enzyme', name: 'Enzyme Treatment', price: 49, description: 'Prevent future clogs' },
          { id: 'warranty', name: 'Extended Warranty', price: 69, description: '6-month guarantee' },
        ]
      }
    },
    {
      type: 'limitedTime',
      props: {
        offerTitle: "Special This Week: Save $50 on Drain Cleaning",
        offerDescription: "Book online now and save $50 on any drain cleaning service",
        discount: {
          type: 'fixed',
          value: 50,
          originalPrice: 199
        },
        urgencyLevel: 'medium',
        spotsAvailable: 8,
        totalSpots: 15
      }
    },
    {
      type: 'floatingCTA',
      props: {
        position: 'bottom-center',
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
  conversionGoal: 'drain-service-booking'
};

export default function DrainCleaningLandingPage() {
  return <LandingPageBuilder config={drainCleaningConfig} />;
}