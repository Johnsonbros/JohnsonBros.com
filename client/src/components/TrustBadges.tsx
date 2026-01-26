import { Shield, Award, Clock } from "lucide-react";

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className = "" }: TrustBadgesProps) {
  const badges = [
    {
      icon: Shield,
      title: "Licensed & Insured",
      subtitle: "MA License #12345",
    },
    {
      icon: Award,
      title: "27+ Years Experience",
      subtitle: "Family-owned since 1997",
    },
    {
      icon: Clock,
      title: "24/7 Emergency Service",
      subtitle: "Always available",
    },
  ];

  return (
    <div className={`flex flex-wrap justify-center gap-6 ${className}`}>
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg"
        >
          <badge.icon className="h-6 w-6" />
          <div>
            <p className="font-semibold text-sm">{badge.title}</p>
            <p className="text-xs opacity-80">{badge.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
