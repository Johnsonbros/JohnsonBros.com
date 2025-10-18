import { Shield, Award, CheckCircle, Building2, Star, BadgeCheck, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
  verified?: boolean;
}

interface TrustBadgesProps {
  badges?: TrustBadge[];
  layout?: 'horizontal' | 'grid' | 'compact';
  showVerification?: boolean;
}

const defaultBadges: TrustBadge[] = [
  {
    icon: <Shield className="h-8 w-8 text-green-600" />,
    title: "Licensed & Insured",
    description: "MA License #PC2741 • $2M Liability",
    verified: true
  },
  {
    icon: <Award className="h-8 w-8 text-blue-600" />,
    title: "BBB A+ Rating",
    description: "Accredited Business since 2009",
    verified: true
  },
  {
    icon: <Building2 className="h-8 w-8 text-purple-600" />,
    title: "EPA Certified",
    description: "Environmental Protection Certified",
    verified: true
  },
  {
    icon: <Star className="h-8 w-8 text-yellow-600" />,
    title: "Google Verified",
    description: "4.9★ from 500+ Reviews",
    verified: true
  },
  {
    icon: <FileCheck className="h-8 w-8 text-indigo-600" />,
    title: "Background Checked",
    description: "All technicians verified",
    verified: true
  },
  {
    icon: <BadgeCheck className="h-8 w-8 text-red-600" />,
    title: "Emergency Ready",
    description: "24/7 Service Available",
    verified: false
  }
];

export function TrustBadges({ 
  badges = defaultBadges,
  layout = 'horizontal',
  showVerification = true
}: TrustBadgesProps) {
  const gridCols = layout === 'grid' 
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' 
    : layout === 'compact'
    ? 'grid-cols-3 sm:grid-cols-6'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';

  if (layout === 'horizontal') {
    return (
      <div className="bg-gray-50 py-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {badges.map((badge, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex flex-col items-center text-center cursor-pointer hover:scale-110 transition-transform duration-200"
                      data-testid={`trust-badge-${index}`}
                    >
                      <div className="relative">
                        {badge.icon}
                        {showVerification && badge.verified && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-gray-900">{badge.title}</h3>
                      <p className="text-xs text-gray-600 max-w-[150px]">{badge.description}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="py-4">
        <div className={`grid ${gridCols} gap-2`}>
          {badges.map((badge, index) => (
            <div 
              key={index}
              className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
              data-testid={`trust-badge-compact-${index}`}
            >
              <div className="relative">
                <div className="scale-75">{badge.icon}</div>
                {showVerification && badge.verified && (
                  <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500 bg-white rounded-full" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 mt-1 text-center">{badge.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-johnson-blue text-white">TRUSTED BY THOUSANDS</Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Customers Choose Us</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Fully licensed, insured, and certified to handle all your plumbing needs with the highest standards of quality and safety.
          </p>
        </div>

        <div className={`grid ${gridCols} gap-6`}>
          {badges.map((badge, index) => (
            <Card 
              key={index}
              className="p-6 text-center hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group"
              data-testid={`trust-badge-card-${index}`}
            >
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-t from-johnson-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative z-10">
                <div className="flex justify-center mb-4 relative">
                  {badge.icon}
                  {showVerification && badge.verified && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg">
                      <div className="bg-green-500 rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{badge.title}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
                
                {showVerification && badge.verified && (
                  <div className="mt-3 text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Trust Message */}
        <div className="mt-8 text-center p-6 bg-gradient-to-r from-johnson-blue/5 to-johnson-orange/5 rounded-lg">
          <p className="text-gray-700">
            <Shield className="h-5 w-5 inline mr-2 text-johnson-blue" />
            <span className="font-medium">100% Satisfaction Guaranteed</span> • All work backed by our comprehensive warranty
          </p>
        </div>
      </div>
    </section>
  );
}