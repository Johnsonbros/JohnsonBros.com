import { Shield, Award, Clock, DollarSign, Wrench, AlertCircle, BadgeCheck, Home, Phone, Users, FileCheck, TrendingUp, Heart, CheckCircle, Star, Lock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Badge Types with detailed information
export interface TrustBadgeData {
  id: string;
  type: 'license' | 'insurance' | 'warranty' | 'emergency' | 'pricing' | 'rating' | 'experience' | 'guarantee';
  title: string;
  shortTitle?: string;
  description: string;
  details?: string[];
  icon: React.ReactNode;
  color: string;
  value?: string | number;
  verifyLink?: string;
  showModal?: boolean;
}

// Badge Component Props
interface TrustBadgeProps {
  badge: TrustBadgeData;
  variant?: 'compact' | 'detailed' | 'card';
  showVerify?: boolean;
  className?: string;
}

// Individual Trust Badge Component
export function TrustBadge({ badge, variant = 'compact', showVerify = true, className = '' }: TrustBadgeProps) {
  const BadgeContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <div className={`flex items-center gap-2 ${className}`}>
            <div className={`${badge.color}`}>{badge.icon}</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{badge.shortTitle || badge.title}</span>
              {badge.value && <span className="text-xs text-gray-500">{badge.value}</span>}
            </div>
          </div>
        );
      
      case 'detailed':
        return (
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-gray-50 ${className}`}>
            <div className={`${badge.color}`}>{badge.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{badge.title}</div>
              <div className="text-xs text-gray-600">{badge.description}</div>
              {badge.value && <div className="text-xs font-bold text-johnson-blue">{badge.value}</div>}
            </div>
            {showVerify && badge.verifyLink && (
              <a href={badge.verifyLink} target="_blank" rel="noopener noreferrer" 
                 className="text-xs text-blue-600 hover:underline">
                Verify →
              </a>
            )}
          </div>
        );
      
      case 'card':
        return (
          <Card className={`p-4 hover:shadow-lg transition-shadow ${className}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`mb-2 ${badge.color}`}>{badge.icon}</div>
              <h4 className="font-bold text-sm mb-1">{badge.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
              {badge.value && (
                <Badge className="mb-2" variant="secondary">{badge.value}</Badge>
              )}
              {badge.details && (
                <ul className="text-xs text-left space-y-1 mt-2">
                  {badge.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              {showVerify && badge.verifyLink && (
                <a href={badge.verifyLink} target="_blank" rel="noopener noreferrer" 
                   className="text-xs text-blue-600 hover:underline mt-2">
                  Verify License →
                </a>
              )}
            </div>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (badge.showModal) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            <BadgeContent />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {badge.icon}
              {badge.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{badge.description}</p>
            {badge.details && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Details:</h4>
                <ul className="space-y-2">
                  {badge.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {badge.value && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Current Status</div>
                <div className="text-lg font-bold text-johnson-blue">{badge.value}</div>
              </div>
            )}
            {badge.verifyLink && (
              <Button asChild variant="outline" className="w-full">
                <a href={badge.verifyLink} target="_blank" rel="noopener noreferrer">
                  Verify Credentials <Info className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <BadgeContent />;
}

// Default Badge Collection
export const defaultTrustBadges: TrustBadgeData[] = [
  {
    id: 'license',
    type: 'license',
    title: 'Massachusetts Licensed Plumber',
    shortTitle: 'Licensed & Insured',
    description: 'MA License #PC1673 - Fully licensed and certified',
    details: [
      'Master Plumber License #PC1673',
      'State Board Certified',
      'Regular Compliance Audits',
      'Continuing Education Requirements Met'
    ],
    icon: <Shield className="h-5 w-5" />,
    color: 'text-green-600',
    value: 'MA #PC1673',
    verifyLink: 'https://www.mass.gov/orgs/board-of-state-examiners-of-plumbers-gas-fitters',
    showModal: true
  },
  {
    id: 'insurance',
    type: 'insurance',
    title: '$2 Million Insurance Coverage',
    shortTitle: '$2M Insured',
    description: 'Comprehensive liability and property damage protection',
    details: [
      'General Liability: $2,000,000',
      'Property Damage: $1,000,000',
      'Workers Compensation: Full Coverage',
      'Bonded for Your Protection'
    ],
    icon: <Shield className="h-5 w-5" />,
    color: 'text-purple-600',
    value: '$2M Coverage',
    showModal: true
  },
  {
    id: 'emergency',
    type: 'emergency',
    title: '24/7 Emergency Service',
    shortTitle: '24/7 Service',
    description: 'Round-the-clock emergency plumbing response',
    details: [
      'Average Response Time: < 2 Hours',
      'Weekend & Holiday Service',
      'No Extra Charge for Nights',
      'Priority Emergency Routing'
    ],
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-600',
    value: '< 2hr Response',
    showModal: true
  },
  {
    id: 'warranty',
    type: 'warranty',
    title: '1-Year Workmanship Warranty',
    shortTitle: '1-Year Warranty',
    description: 'Complete warranty on all labor and manufacturer warranty on parts',
    details: [
      '12 Months on All Labor',
      'Manufacturer Warranty on Parts',
      'Free Re-service if Issues Arise',
      'Transferable to New Owners'
    ],
    icon: <Wrench className="h-5 w-5" />,
    color: 'text-orange-600',
    value: '1 Year',
    showModal: true
  },
  {
    id: 'pricing',
    type: 'pricing',
    title: 'Upfront Transparent Pricing',
    shortTitle: 'No Hidden Fees',
    description: 'Price approved before work begins - no surprises',
    details: [
      'Written Estimates Before Work',
      'No Hidden Fees or Charges',
      'Price Match Guarantee',
      'Multiple Payment Options'
    ],
    icon: <DollarSign className="h-5 w-5" />,
    color: 'text-green-600',
    value: 'Guaranteed',
    showModal: true
  },
  {
    id: 'rating',
    type: 'rating',
    title: 'Google 4.9★ Rating',
    shortTitle: '4.9★ Google',
    description: 'Consistently rated among the best in Massachusetts',
    details: [
      'Over 200 Verified Reviews',
      'A+ Better Business Bureau',
      'HomeAdvisor Elite Service',
      'Angie\'s List Super Service'
    ],
    icon: <Star className="h-5 w-5" />,
    color: 'text-yellow-600',
    value: '200+ Reviews',
    verifyLink: 'https://www.google.com/search?q=johnson+bros+plumbing+quincy+ma+reviews',
    showModal: true
  },
  {
    id: 'experience',
    type: 'experience',
    title: 'Family Owned Since 2008',
    shortTitle: '15+ Years',
    description: '15+ years serving Massachusetts families',
    details: [
      'Established 2008',
      'Family-Owned Business',
      'Over 10,000 Jobs Completed',
      'Local Community Focused'
    ],
    icon: <Home className="h-5 w-5" />,
    color: 'text-blue-600',
    value: 'Since 2008',
    showModal: true
  },
  {
    id: 'guarantee',
    type: 'guarantee',
    title: '100% Satisfaction Guarantee',
    shortTitle: 'Satisfaction Guaranteed',
    description: 'We\'re not done until you\'re completely satisfied',
    details: [
      'Full Service Guarantee',
      'Free Follow-up Visits',
      'No Questions Asked Policy',
      'Customer Happiness Priority'
    ],
    icon: <Heart className="h-5 w-5" />,
    color: 'text-red-600',
    value: '100%',
    showModal: true
  }
];

// Trust Badge Strip Component - Displays multiple badges in a row
interface TrustBadgeStripProps {
  badges?: TrustBadgeData[];
  variant?: 'compact' | 'detailed' | 'card';
  className?: string;
  limit?: number;
}

export function TrustBadgeStrip({ 
  badges = defaultTrustBadges, 
  variant = 'compact', 
  className = '',
  limit
}: TrustBadgeStripProps) {
  const displayBadges = limit ? badges.slice(0, limit) : badges;
  
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {displayBadges.map((badge) => (
        <TrustBadge key={badge.id} badge={badge} variant={variant} />
      ))}
    </div>
  );
}

// Trust Section Component - Full trust display section
interface TrustSectionProps {
  title?: string;
  subtitle?: string;
  badges?: TrustBadgeData[];
  layout?: 'grid' | 'strip' | 'carousel';
  className?: string;
}

export function TrustSection({ 
  title = "Why Trust Johnson Bros?",
  subtitle = "Licensed, insured, and committed to excellence",
  badges = defaultTrustBadges,
  layout = 'grid',
  className = ''
}: TrustSectionProps) {
  return (
    <div className={`py-12 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
      </div>
      
      {layout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <TrustBadge key={badge.id} badge={badge} variant="card" />
          ))}
        </div>
      )}
      
      {layout === 'strip' && (
        <TrustBadgeStrip badges={badges} variant="detailed" />
      )}
    </div>
  );
}

// Security Badge for forms and sensitive areas
export function SecurityBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Lock className="h-4 w-4 text-green-600" />
      <span className="text-gray-600">Your information is secure and encrypted</span>
    </div>
  );
}

// Trust Counter Component for animated statistics
interface TrustCounterProps {
  value: number;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function TrustCounter({ value, label, suffix = '', icon, className = '' }: TrustCounterProps) {
  return (
    <div className={`text-center ${className}`}>
      {icon && <div className="mb-2">{icon}</div>}
      <div className="text-4xl font-bold text-johnson-blue">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}