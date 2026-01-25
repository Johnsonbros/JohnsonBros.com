import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const waterHeaterConfig: LandingPageConfig = {
  title: "Water Heater Repair & Installation Quincy MA | Same Day Service",
  description: "Expert water heater installation, repair & tankless upgrades in Quincy, Weymouth & South Shore. 24/7 emergency service, upfront pricing. Save $200 on new installations. Call (617) 479-9911!",
  keywords: ["water heater repair Quincy", "water heater installation", "tankless water heater", "hot water heater replacement", "emergency water heater service", "Bradford White installer", "Rheem water heater", "no hot water", "leaking water heater", "water heater maintenance"],
  
  hero: {
    type: 'service',
    props: {
      serviceName: "Water Heater Services",
      headline: "No Hot Water? We'll Fix It Today!",
      subheadline: "Professional water heater repair, replacement & tankless installation. 24/7 emergency service with upfront pricing.",
      price: "$299",
      features: [
        "Same-day installation available",
        "All major brands serviced",
        "Tankless upgrade specialists",
        "10-year warranty options"
      ],
      beforeImage: "https://images.unsplash.com/photo-1585129777188-94600bc7b4b3?q=80&w=2000",
      afterImage: "https://images.unsplash.com/photo-1564767655658-4e6b365884ff?q=80&w=2000",
      rating: 4.9,
      reviewCount: 362
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
          { label: "Water Heaters Installed", value: "3,200+", icon: "Flame" },
          { label: "Emergency Response", value: "24/7", icon: "Clock" },
          { label: "Average Savings", value: "$450/year", icon: "DollarSign" },
          { label: "Warranty Coverage", value: "10 Years", icon: "Shield" }
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
            icon: "Flame",
            title: "Same Day Hot Water",
            description: "Get hot water restored today with emergency service",
            highlight: "24/7 availability"
          },
          {
            icon: "DollarSign",
            title: "Best Price Guarantee",
            description: "We'll beat any written estimate by 10%",
            highlight: "Lowest price guaranteed"
          },
          {
            icon: "Shield",
            title: "10-Year Warranty",
            description: "Full parts and labor warranty on new installations",
            highlight: "Complete coverage"
          },
          {
            icon: "Award",
            title: "Licensed & Certified",
            description: "Factory authorized installer for all major brands",
            highlight: "Expert installation"
          }
        ]
      }
    },
    {
      type: 'team',
      props: {
        title: "Water Heater Specialists",
        showCertifications: true
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
            id: 'repair', 
            name: 'Water Heater Repair', 
            basePrice: 299, 
            description: 'Fix most water heater issues same-day',
            features: ['Diagnostic included', 'All parts available', '90-day warranty']
          },
          { 
            id: 'standard', 
            name: '40-Gallon Tank Install', 
            basePrice: 1899, 
            description: 'Standard electric or gas water heater',
            features: ['Removal of old unit', 'All permits included', '6-year warranty'],
            highlighted: true
          },
          { 
            id: 'tankless', 
            name: 'Tankless Upgrade', 
            basePrice: 3499, 
            description: 'Endless hot water & energy savings',
            features: ['Save 30% on energy', 'Space saving design', '15-year warranty']
          },
          { 
            id: 'commercial', 
            name: 'Commercial Installation', 
            basePrice: 4999, 
            description: 'Heavy-duty commercial units',
            features: ['80+ gallon capacity', 'Fast recovery rate', 'Extended warranty']
          }
        ],
        addons: [
          { id: 'expansion', name: 'Expansion Tank', price: 249, description: 'Protect from pressure damage' },
          { id: 'pan', name: 'Drain Pan Installation', price: 149, description: 'Prevent water damage' },
          { id: 'warranty', name: 'Extended Warranty', price: 299, description: 'Add 5 years coverage' },
          { id: 'maintenance', name: 'Annual Maintenance Plan', price: 199, description: 'Yearly flush and inspection' }
        ],
        financingOptions: {
          available: true,
          minAmount: 1000,
          description: "0% financing for 12 months on installations over $1000"
        }
      }
    },
    {
      type: 'limitedTime',
      props: {
        offerTitle: "SAVE $200 on New Water Heater Installation",
        offerDescription: "Limited time offer - Book online and save $200 on any new water heater installation!",
        discount: {
          type: 'fixed',
          value: 200,
          originalPrice: 1899
        },
        urgencyLevel: 'high',
        spotsAvailable: 5,
        totalSpots: 12
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
        type: 'emergency',
        message: "No hot water? We offer 24/7 emergency service!",
        position: 'top'
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
  conversionGoal: 'water-heater-booking'
};

export default function WaterHeaterLandingPage() {
  return <LandingPageBuilder config={waterHeaterConfig} />;
}