import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const pipeRepairConfig: LandingPageConfig = {
  title: "Pipe Repair & Leak Detection Quincy MA | 24/7 Emergency Service",
  description: "Expert pipe repair, burst pipe fixes & leak detection in Quincy & South Shore MA. Frozen pipes, repiping, water damage prevention. Emergency service available. Call (617) 479-9911!",
  keywords: ["pipe repair Quincy MA", "burst pipe repair", "leak detection", "frozen pipe repair", "repiping services", "emergency pipe repair", "water leak repair", "copper pipe repair", "pipe replacement", "slab leak repair"],
  
  hero: {
    type: 'emergency',
    props: {
      headline: "Burst Pipe or Water Leak? Emergency Repair Available!",
      subheadline: "Professional pipe repair and leak detection services. We'll find and fix any leak fast - 24/7 emergency response.",
      emergencyPhone: "(617) 479-9911",
      responseTime: "60 minutes",
      features: [
        "Advanced leak detection technology",
        "All pipe materials repaired",
        "Prevent water damage",
        "Insurance claim assistance"
      ],
      showTimer: true,
      rating: 4.9,
      reviewCount: 389
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
          { label: "Leaks Fixed", value: "4,200+", icon: "Droplets" },
          { label: "Response Time", value: "<1 Hour", icon: "Clock" },
          { label: "Water Saved", value: "2M Gallons", icon: "Waves" },
          { label: "Insurance Approved", value: "100%", icon: "Shield" }
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
            icon: "AlertTriangle",
            title: "24/7 Emergency Response",
            description: "Burst pipes don't wait - neither do we",
            highlight: "60-minute response"
          },
          {
            icon: "Search",
            title: "Leak Detection Experts",
            description: "Advanced technology finds hidden leaks",
            highlight: "No unnecessary damage"
          },
          {
            icon: "Shield",
            title: "Lifetime Repair Warranty",
            description: "Our repairs are guaranteed for life",
            highlight: "100% confidence"
          },
          {
            icon: "FileText",
            title: "Insurance Assistance",
            description: "We work directly with your insurance",
            highlight: "Hassle-free claims"
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
            id: 'leak', 
            name: 'Leak Detection & Repair', 
            basePrice: 349, 
            description: 'Find and fix hidden leaks',
            features: ['Electronic detection', 'Minimal damage', 'Same-day repair']
          },
          { 
            id: 'burst', 
            name: 'Burst Pipe Emergency', 
            basePrice: 449, 
            description: '24/7 emergency pipe repair',
            features: ['Immediate response', 'Stop water damage', 'Complete repair'],
            highlighted: true
          },
          { 
            id: 'frozen', 
            name: 'Frozen Pipe Service', 
            basePrice: 299, 
            description: 'Thaw and repair frozen pipes',
            features: ['Safe thawing', 'Damage prevention', 'Insulation advice']
          },
          { 
            id: 'repipe', 
            name: 'Whole House Repiping', 
            basePrice: 4999, 
            description: 'Complete pipe replacement',
            features: ['All new piping', 'Code compliance', 'Lifetime warranty']
          }
        ],
        addons: [
          { id: 'camera', name: 'Video Pipe Inspection', price: 199, description: 'See inside your pipes' },
          { id: 'insulation', name: 'Pipe Insulation', price: 299, description: 'Prevent future freezing' },
          { id: 'valve', name: 'Shut-off Valve Install', price: 149, description: 'Quick water control' },
          { id: 'monitor', name: 'Leak Detection System', price: 499, description: 'Smart leak monitoring' }
        ],
        financingOptions: {
          available: true,
          minAmount: 1000,
          description: "Emergency repairs now, pay over 6 months interest-free"
        }
      }
    },
    {
      type: 'limitedTime',
      props: {
        offerTitle: "FREE Leak Detection with Any Repair",
        offerDescription: "Book now and get FREE electronic leak detection (a $199 value) with any pipe repair service!",
        discount: {
          type: 'fixed',
          value: 199,
          originalPrice: 548
        },
        urgencyLevel: 'high',
        spotsAvailable: 4,
        totalSpots: 8
      }
    },
    {
      type: 'floatingCTA',
      props: {
        position: 'bottom-right',
        style: 'emergency',
        message: "Water leak? Call now!",
        showPhone: true
      }
    },
    {
      type: 'urgency',
      props: {
        type: 'emergency',
        message: "Active water leak? We're available 24/7 for emergencies!",
        position: 'top',
        showPhone: true
      }
    }
  ],
  
  sections: ['reviews', 'services', 'serviceAreas'],
  
  featureFlags: {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true,
    autoOpenBookingDelay: 30
  },
  
  variant: 'B',
  conversionGoal: 'pipe-repair-booking'
};

export default function PipeRepairLandingPage() {
  return <LandingPageBuilder config={pipeRepairConfig} />;
}