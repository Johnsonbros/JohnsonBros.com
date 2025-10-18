import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, DollarSign } from "lucide-react";

interface MobileServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    price?: number;
    category?: string;
    duration?: string;
  };
  isSelected?: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}

export default function MobileServiceCard({ 
  service, 
  isSelected, 
  onSelect, 
  icon 
}: MobileServiceCardProps) {
  return (
    <Card
      className={`touch-manipulation cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-johnson-blue bg-blue-50 ring-2 ring-johnson-blue/50'
          : 'hover:border-gray-400 active:scale-[0.98]'
      }`}
      onClick={onSelect}
      data-testid={`service-card-${service.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div 
            className={`p-2.5 rounded-lg flex-shrink-0 ${
              service.category === 'emergency' 
                ? 'bg-red-100 text-red-600' 
                : service.category === 'maintenance' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 mb-1">
              {service.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {service.description}
            </p>
            
            {/* Price and Duration */}
            <div className="flex items-center gap-3 mt-2">
              {service.price && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    ${service.price}+
                  </span>
                </div>
              )}
              {service.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {service.duration}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Selection Indicator */}
          <ChevronRight 
            className={`h-5 w-5 flex-shrink-0 transition-transform ${
              isSelected ? 'text-johnson-blue rotate-90' : 'text-gray-400'
            }`} 
          />
        </div>
      </CardContent>
    </Card>
  );
}