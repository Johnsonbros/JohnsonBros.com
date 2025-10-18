import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/lib/housecallApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Droplets, Flame, Wrench, Settings, Home } from "lucide-react";

interface ServicesSectionProps {
  onBookService: (serviceId: string) => void;
}

const serviceIcons = {
  emergency: AlertTriangle,
  maintenance: Droplets,
  installation: Flame,
  repair: Settings,
  renovation: Home,
  default: Wrench,
};

const serviceImages = {
  "emergency-repair": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
  "drain-cleaning": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
  "water-heater": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
  "fixtures": "https://images.unsplash.com/photo-1604709177225-055f99402ea3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
  "pipe-repair": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
  "remodeling": "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
};

export default function ServicesSection({ onBookService }: ServicesSectionProps) {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["/api/v1/services"],
    queryFn: getServices,
  });

  if (error) {
    return (
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600">Failed to load services. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-12 sm:py-16 lg:py-20 bg-white bg-pipes-orange relative" style={{ backgroundBlendMode: 'overlay' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Professional Services</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            From routine maintenance to emergency repairs, we provide comprehensive plumbing solutions for your home and business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8">
                <Skeleton className="w-full h-48 mb-6 rounded-lg" />
                <div className="flex items-center mb-4">
                  <Skeleton className="w-12 h-12 rounded-lg mr-4" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
              </div>
            ))
          ) : (
            services?.map((service) => {
              const IconComponent = serviceIcons[service.category as keyof typeof serviceIcons] || serviceIcons.default;
              const imageUrl = serviceImages[service.id as keyof typeof serviceImages] || serviceImages["emergency-repair"];
              
              const getIconColor = (category: string) => {
                switch (category) {
                  case 'emergency': return 'text-red-600 bg-red-100';
                  case 'maintenance': return 'text-johnson-blue bg-blue-100';
                  case 'installation': return 'text-johnson-orange bg-orange-100';
                  case 'repair': return 'text-purple-600 bg-purple-100';
                  case 'renovation': return 'text-indigo-600 bg-indigo-100';
                  default: return 'text-green-600 bg-green-100';
                }
              };

              return (
                <div 
                  key={service.id}
                  className="bg-gray-50 rounded-xl p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group service-card touch-target"
                  data-testid={`service-card-${service.id}`}
                >
                  <div className="mb-4 sm:mb-6">
                    <img 
                      src={imageUrl}
                      alt={`${service.name} service`}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex items-start mb-4">
                    <div className={`p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 ${getIconColor(service.category || 'default')}`}>
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{service.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{service.description}</p>
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => onBookService(service.id)}
                      className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-semibold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto touch-target"
                      data-testid={`book-service-${service.id}`}
                    >
                      Book Service
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
