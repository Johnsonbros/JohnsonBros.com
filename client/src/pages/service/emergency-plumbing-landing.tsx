import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const emergencyPlumbingConfig: LandingPageConfig = {
  title: "24/7 Emergency Plumber Quincy MA | Fast Response, Call Now!",
  description: "Emergency plumbing services in Quincy, Weymouth & South Shore MA. Available 24/7 for burst pipes, flooding, sewage backups. 60-minute response time guaranteed. Call (617) 479-9911!",
  keywords: ["emergency plumber Quincy MA", "24 hour plumber", "burst pipe emergency", "flooding repair", "sewage backup", "water heater emergency", "weekend plumber", "night plumber", "urgent plumbing repair", "plumbing emergency service"],
  
  hero: {
    type: 'emergency',
    props: {
      headline: "PLUMBING EMERGENCY? We're On Our Way!",
      subheadline: "24/7 emergency plumbing service with guaranteed 60-minute response. No extra charge for nights, weekends, or holidays!",
      emergencyPhone: "(617) 479-9911",
      responseTime: "60 minutes",
      features: [
        "24/7/365 availability",
        "No overtime charges",
        "All emergencies handled",
        "Direct insurance billing"
      ],
      showTimer: true,
      showAvailability: true,
      rating: 5.0,
      reviewCount: 512
    }
  },
  
  trustModules: [
    {
      type: 'badges',
      props: {
        layout: 'horizontal',
        showVerification: true,
        emergency: true
      }
    },
    {
      type: 'socialProof',
      props: {
        stats: [
          { label: "Avg Response Time", value: "47 min", icon: "Clock" },
          { label: "Emergencies Resolved", value: "8,400+", icon: "AlertTriangle" },
          { label: "Available Now", value: "24/7", icon: "CheckCircle" },
          { label: "Customer Rating", value: "5.0★", icon: "Star" }
        ],
        animated: true
      }
    },
    {
      type: 'guarantees',
      props: {
        layout: 'grid',
        showSeal: true,
        emergency: true,
        guarantees: [
          {
            icon: "Clock",
            title: "60-Minute Response",
            description: "We guarantee arrival within 60 minutes",
            highlight: "Or service is FREE"
          },
          {
            icon: "DollarSign",
            title: "No Overtime Charges",
            description: "Same rate 24/7 - nights, weekends, holidays",
            highlight: "Fair pricing always"
          },
          {
            icon: "Phone",
            title: "Live Phone Support",
            description: "Real plumber answers - no call centers",
            highlight: "Direct help now"
          },
          {
            icon: "Shield",
            title: "Insurance Approved",
            description: "We bill your insurance directly",
            highlight: "No upfront payment"
          }
        ]
      }
    },
    {
      type: 'team',
      props: {
        title: "Emergency Response Team On Standby",
        showAvailability: true,
        emergency: true
      }
    }
  ],
  
  conversionModules: [
    {
      type: 'pricing',
      props: {
        showComparison: false,
        emergency: true,
        services: [
          { 
            id: 'burst-pipe', 
            name: 'Burst Pipe Emergency', 
            basePrice: 399, 
            description: 'Stop water damage immediately',
            features: ['Immediate response', 'Complete repair', 'Damage prevention'],
            urgency: 'critical'
          },
          { 
            id: 'flood', 
            name: 'Flooding/Water Removal', 
            basePrice: 499, 
            description: 'Emergency water extraction & repair',
            features: ['Water removal', 'Source repair', 'Damage mitigation'],
            urgency: 'critical',
            highlighted: true
          },
          { 
            id: 'sewage', 
            name: 'Sewage Backup', 
            basePrice: 599, 
            description: 'Hazardous waste removal & repair',
            features: ['Safe cleanup', 'Line clearing', 'Sanitization'],
            urgency: 'critical'
          },
          { 
            id: 'no-water', 
            name: 'No Water Emergency', 
            basePrice: 349, 
            description: 'Restore water supply fast',
            features: ['Diagnose issue', 'Quick repair', 'Water restored'],
            urgency: 'high'
          },
          { 
            id: 'gas-leak', 
            name: 'Gas Leak Emergency', 
            basePrice: 449, 
            description: 'Dangerous gas leak repair',
            features: ['Immediate response', 'Safety first', 'Certified repair'],
            urgency: 'critical'
          }
        ],
        note: "Emergency service pricing includes immediate response, all labor, and basic materials. Additional parts billed at cost."
      }
    },
    {
      type: 'urgency',
      props: {
        type: 'emergency',
        message: "⚠️ PLUMBING EMERGENCY? Technician available NOW!",
        position: 'top',
        showPhone: true,
        pulsing: true
      }
    },
    {
      type: 'floatingCTA',
      props: {
        position: 'bottom-center',
        style: 'emergency',
        message: "EMERGENCY? CALL NOW!",
        showPhone: true,
        pulsing: true
      }
    },
    {
      type: 'exitIntent',
      props: {
        emergency: true,
        title: "WAIT! Don't Let It Get Worse!",
        message: "Water damage compounds every minute. Call now for immediate help!",
        showPhone: true
      }
    }
  ],
  
  sections: ['reviews'],
  
  featureFlags: {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true,
    autoOpenBookingDelay: 0
  },
  
  variant: 'B',
  conversionGoal: 'emergency-service-call'
};

export default function EmergencyPlumbingLandingPage() {
  return <LandingPageBuilder config={emergencyPlumbingConfig} />;
}