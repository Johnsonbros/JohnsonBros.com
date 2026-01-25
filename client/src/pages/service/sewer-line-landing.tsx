import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const sewerLineConfig: LandingPageConfig = {
  title: "Sewer Line Cleaning & Repair Quincy MA | Camera Inspection Included",
  description: "Professional sewer line cleaning, camera inspection & repair in Quincy & South Shore MA. Main line cleaning, root removal, trenchless repair. Free video inspection. Call (617) 479-9911!",
  keywords: ["sewer line cleaning Quincy", "main line cleaning", "sewer camera inspection", "sewer line repair", "trenchless sewer repair", "root removal", "sewer backup", "main drain clog", "sewer replacement", "hydro jetting sewer"],
  
  hero: {
    type: 'service',
    props: {
      serviceName: "Sewer Line Services",
      headline: "Sewer Backup? We'll Clear Your Main Line Today!",
      subheadline: "Professional sewer line cleaning with FREE camera inspection. Advanced equipment for tough blockages, root removal, and trenchless repairs.",
      price: "$399",
      features: [
        "FREE HD camera inspection included",
        "Hydro jetting for tough clogs",
        "Root cutting technology",
        "Trenchless repair options"
      ],
      beforeImage: "https://images.unsplash.com/photo-1558913037-5b12dbec773f?q=80&w=2000",
      afterImage: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000",
      rating: 4.8,
      reviewCount: 297
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
          { label: "Sewer Lines Cleared", value: "3,100+", icon: "Waves" },
          { label: "Camera Inspections", value: "5,000+", icon: "Camera" },
          { label: "Roots Removed", value: "1,800+", icon: "Trees" },
          { label: "Prevented Dig-ups", value: "890", icon: "Shield" }
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
            icon: "Camera",
            title: "FREE Camera Inspection",
            description: "HD video inspection included with every sewer service",
            highlight: "$299 value included"
          },
          {
            icon: "Trees",
            title: "Root Removal Experts",
            description: "Specialized equipment cuts through tough tree roots",
            highlight: "Permanent solutions"
          },
          {
            icon: "Home",
            title: "No Dig Technology",
            description: "Trenchless repair saves your lawn and driveway",
            highlight: "Minimal disruption"
          },
          {
            icon: "FileText",
            title: "Detailed Report",
            description: "Video recording and written report of your sewer condition",
            highlight: "For your records"
          }
        ]
      }
    },
    {
      type: 'team',
      props: {
        title: "Certified Sewer Line Technicians",
        showCertifications: true,
        certifications: ["NASSCO PACP", "Trenchless Technology", "Hydro Jet Certified"]
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
            id: 'cleaning', 
            name: 'Main Line Cleaning', 
            basePrice: 399, 
            description: 'Clear main sewer line blockages',
            features: ['Camera inspection FREE', '100ft cable reach', '6-month guarantee'],
            highlighted: true
          },
          { 
            id: 'hydro', 
            name: 'Hydro Jetting Service', 
            basePrice: 799, 
            description: 'High-pressure cleaning for severe clogs',
            features: ['4000 PSI pressure', 'Removes all debris', '1-year guarantee']
          },
          { 
            id: 'roots', 
            name: 'Root Removal Service', 
            basePrice: 599, 
            description: 'Cut and remove invasive tree roots',
            features: ['Mechanical cutting', 'Root killer treatment', 'Annual maintenance plan']
          },
          { 
            id: 'repair', 
            name: 'Trenchless Sewer Repair', 
            basePrice: 3999, 
            description: 'Fix broken pipes without digging',
            features: ['Pipe lining technology', 'Same-day completion', '50-year warranty']
          },
          { 
            id: 'replace', 
            name: 'Sewer Line Replacement', 
            basePrice: 7999, 
            description: 'Complete sewer line replacement',
            features: ['New PVC piping', 'City permits included', 'Lifetime warranty']
          }
        ],
        addons: [
          { id: 'locate', name: 'Line Location Service', price: 199, description: 'Map your entire sewer system' },
          { id: 'enzyme', name: 'Annual Enzyme Treatment', price: 299, description: '12 months of preventive care' },
          { id: 'backflow', name: 'Backflow Preventer', price: 899, description: 'Prevent sewage backups' },
          { id: 'cleanout', name: 'Cleanout Installation', price: 499, description: 'Easy future access' }
        ],
        financingOptions: {
          available: true,
          minAmount: 2000,
          description: "0% financing for 18 months on repairs over $2000"
        }
      }
    },
    {
      type: 'limitedTime',
      props: {
        offerTitle: "FREE Camera Inspection - $299 Value!",
        offerDescription: "Book your sewer line service today and get a FREE HD camera inspection to see exactly what's causing your problem!",
        discount: {
          type: 'addon',
          value: 299,
          originalPrice: 698
        },
        urgencyLevel: 'medium',
        spotsAvailable: 6,
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
        type: 'warning',
        message: "⚠️ Sewer backups can cause serious health hazards and property damage",
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
  conversionGoal: 'sewer-line-booking'
};

export default function SewerLineLandingPage() {
  return <LandingPageBuilder config={sewerLineConfig} />;
}