import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/lib/housecallApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Droplets, Flame, Wrench, Settings, Home, ArrowRight, HardHat, MapPin } from "lucide-react";
import { Link } from "wouter";
import { InteractiveCoverageMap } from "@/components/InteractiveCoverageMap";
import emergencyImage from "@assets/emergency.jpg";
import pipeRepairImage from "@assets/new-construction.jpg";
import serviceCallImage from "@assets/plumbing.jpg";
import drainCleaningImage from "@assets/dirty-sink.jpg";

interface ServicesSectionProps {
  onBookService: (serviceId: string) => void;
}

const serviceIcons: Record<string, typeof Wrench> = {
  emergency: AlertTriangle,
  maintenance: Droplets,
  installation: Flame,
  repair: Settings,
  renovation: Home,
  construction: HardHat,
  default: Wrench,
};

const serviceImages: Record<string, string> = {
  "service_call": serviceCallImage,
  "emergency_repair": emergencyImage,
  "emergency-repair": emergencyImage,
  "drain_cleaning": drainCleaningImage,
  "drain-cleaning": drainCleaningImage,
  "water_heater_service": emergencyImage,
  "water-heater": emergencyImage,
  "fixtures": serviceCallImage,
  "pipe_repair": pipeRepairImage,
  "pipe-repair": pipeRepairImage,
  "general_plumbing": serviceCallImage,
  "new_construction": pipeRepairImage,
  "remodeling": pipeRepairImage,
};

const servicePageLinks: Record<string, string> = {
  "service_call": "/services/general-plumbing",
  "emergency_repair": "/services/emergency-plumbing",
  "drain_cleaning": "/services/drain-cleaning",
  "water_heater_service": "/services/water-heater",
  "pipe_repair": "/services/pipe-repair",
  "general_plumbing": "/services/general-plumbing",
  "new_construction": "/services/new-construction",
};

const additionalServices = [
  {
    id: "new_construction",
    name: "New Construction",
    description: "Complete plumbing installation for new builds, renovations, and additions. Licensed for residential and commercial projects.",
    category: "construction",
    price: 99,
  }
];

export default function ServicesSection({ onBookService }: ServicesSectionProps) {
  const { data: apiServices, isLoading, error } = useQuery({
    queryKey: ["/api/v1/services"],
    queryFn: getServices,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const services = apiServices ? [...apiServices, ...additionalServices] : additionalServices;

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

  const getIconColor = (category: string) => {
    switch (category) {
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-johnson-blue bg-blue-100';
      case 'installation': return 'text-johnson-orange bg-orange-100';
      case 'repair': return 'text-purple-600 bg-purple-100';
      case 'renovation': return 'text-indigo-600 bg-indigo-100';
      case 'construction': return 'text-amber-600 bg-amber-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

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
            services?.filter(s => s.id !== 'service_call').map((service) => {
              const IconComponent = serviceIcons[service.category as keyof typeof serviceIcons] || serviceIcons.default;
              const imageUrl = serviceImages[service.id] || serviceImages["service_call"];
              const pageLink = servicePageLinks[service.id];

              return (
                <div 
                  key={service.id}
                  className="bg-gray-50 rounded-xl p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group service-card touch-target flex flex-col"
                  data-testid={`service-card-${service.id}`}
                >
                  <div className="mb-4 sm:mb-6 overflow-hidden rounded-lg">
                    {pageLink ? (
                      <Link href={pageLink}>
                        <img 
                          src={imageUrl}
                          alt={`${service.name} service`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-40 sm:h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                      </Link>
                    ) : (
                      <img 
                        src={imageUrl}
                        alt={`${service.name} service`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-40 sm:h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="flex items-start mb-4">
                    <div className={`p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 ${getIconColor(service.category || 'default')}`}>
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    {pageLink ? (
                      <Link href={pageLink}>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight hover:text-johnson-orange transition-colors cursor-pointer">
                          {service.name}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{service.name}</h3>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base flex-grow">{service.description}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => onBookService(service.id)}
                      variant="brand-primary"
                      size="xl"
                      className="flex-1 touch-target"
                      data-testid={`book-service-${service.id}`}
                    >
                      Book Service
                    </Button>
                    {pageLink && (
                      <Link href={pageLink}>
                        <Button 
                          variant="brand-outline-accent"
                          size="xl"
                          className="w-full sm:w-auto touch-target"
                          data-testid={`learn-more-${service.id}`}
                        >
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Service Area Map */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-johnson-blue/10 text-johnson-blue text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <MapPin className="h-4 w-4" />
              Service Coverage
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Serving the South Shore & Greater Boston
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fast response times across 14 communities. Click a location to see available services.
            </p>
          </div>
          <InteractiveCoverageMap onBookService={() => onBookService('service_call')} compact />
          <div className="text-center mt-6">
            <Link href="/service-areas">
              <Button variant="outline" className="border-johnson-blue text-johnson-blue hover:bg-johnson-blue hover:text-white">
                View All Service Areas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
