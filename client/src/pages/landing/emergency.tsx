import { LandingPageBuilder, LandingPageConfig } from "@/components/landing/LandingPageBuilder";

const emergencyLandingConfig: LandingPageConfig = {
  title: "24/7 Emergency Plumbing Service | Johnson Brothers Plumbing",
  description: "Burst pipe? Major leak? Get immediate emergency plumbing help in Quincy, MA. Available 24/7, licensed & insured. Call now or book online!",
  keywords: ["emergency plumber", "24/7 plumbing", "burst pipe repair", "emergency leak repair", "Quincy MA plumber"],
  
  hero: {
    type: 'emergency',
    props: {
      headline: "EMERGENCY PLUMBING HELP IS HERE!",
      subheadline: "Burst pipes, major leaks, flooding - We'll be there in 30 minutes or less!",
      showAvailability: true
    }
  },
  
  trustModules: [
    {
      type: 'socialProof',
      props: {
        position: 'top',
        showViewers: true,
        showRecentJobs: true,
        showStats: true
      }
    },
    {
      type: 'badges',
      props: {
        layout: 'compact',
        showVerification: true
      }
    },
    {
      type: 'team',
      props: {
        layout: 'featured',
        showStats: true,
        members: [
          {
            id: "emergency-tech",
            name: "Emergency Response Team",
            role: "24/7 On-Call Specialists",
            experience: "Available Now",
            certifications: ["Emergency Certified", "Rapid Response Trained"],
            specialties: ["Burst Pipes", "Flood Control", "Emergency Shutoffs"],
            rating: 4.9,
            jobsCompleted: 2500,
            bio: "Our emergency team is standing by 24/7 to handle your plumbing crisis."
          }
        ]
      }
    }
  ],
  
  conversionModules: [
    {
      type: 'urgency',
      props: {
        type: 'combined',
        position: 'banner',
        animated: true
      }
    },
    {
      type: 'floatingCTA',
      props: {
        position: 'bottom-right',
        style: 'expanded',
        primaryAction: {
          text: "GET EMERGENCY HELP",
          highlight: true
        }
      }
    },
    {
      type: 'exitIntent',
      props: {
        triggerDelay: 500,
        offer: {
          type: 'waived-fee',
          value: '$99',
          headline: "WAIT! Emergency Fee Waived!",
          description: "Book now and we'll waive the emergency service fee"
        }
      }
    }
  ],
  
  sections: ['services', 'reviews'],
  
  featureFlags: {
    showExitIntent: true,
    showFloatingCTA: true,
    showUrgencyIndicators: true
  },
  
  variant: 'A',
  conversionGoal: 'emergency-booking'
};

export default function EmergencyLandingPage() {
  return <LandingPageBuilder config={emergencyLandingConfig} />;
}