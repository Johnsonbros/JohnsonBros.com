import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Clock, CheckCircle, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: number;
  title: string;
  location: string;
  serviceType: string;
  duration: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  completedDate: string;
  testimonial?: {
    text: string;
    author: string;
  };
}

const featuredProjects: Project[] = [
  {
    id: 1,
    title: "Complete Bathroom Renovation",
    location: "Brookline, MA",
    serviceType: "Bathroom Remodel",
    duration: "3 days",
    description: "Full bathroom plumbing replacement including new fixtures, piping, and water heater installation.",
    beforeImage: "/api/placeholder/600/400",
    afterImage: "/api/placeholder/600/400",
    completedDate: "2 weeks ago",
    testimonial: {
      text: "Johnson Bros transformed our outdated bathroom into a modern oasis. Professional, efficient, and clean!",
      author: "Sarah M."
    }
  },
  {
    id: 2,
    title: "Emergency Pipe Burst Repair",
    location: "Cambridge, MA",
    serviceType: "Emergency Plumbing",
    duration: "4 hours",
    description: "Urgent repair of burst main water line, preventing extensive water damage to home.",
    beforeImage: "/api/placeholder/600/400",
    afterImage: "/api/placeholder/600/400",
    completedDate: "1 week ago",
    testimonial: {
      text: "They arrived within 30 minutes of my call at 2 AM. Saved our basement from flooding!",
      author: "Michael K."
    }
  },
  {
    id: 3,
    title: "Kitchen Sink & Disposal Installation",
    location: "Newton, MA",
    serviceType: "Kitchen Plumbing",
    duration: "2 hours",
    description: "New double sink installation with garbage disposal and updated plumbing connections.",
    beforeImage: "/api/placeholder/600/400",
    afterImage: "/api/placeholder/600/400",
    completedDate: "3 days ago",
    testimonial: {
      text: "Quick, clean work. The team was respectful of our home and completed everything on schedule.",
      author: "Jennifer L."
    }
  },
  {
    id: 4,
    title: "Whole House Re-piping",
    location: "Somerville, MA",
    serviceType: "Pipe Replacement",
    duration: "5 days",
    description: "Complete replacement of old galvanized pipes with modern copper piping throughout the home.",
    beforeImage: "/api/placeholder/600/400",
    afterImage: "/api/placeholder/600/400",
    completedDate: "1 month ago",
    testimonial: {
      text: "Major project handled with minimal disruption. Water pressure is amazing now!",
      author: "Robert D."
    }
  },
  {
    id: 5,
    title: "Water Heater Replacement",
    location: "Boston, MA",
    serviceType: "Water Heater",
    duration: "3 hours",
    description: "Tankless water heater installation with improved energy efficiency and endless hot water.",
    beforeImage: "/api/placeholder/600/400",
    afterImage: "/api/placeholder/600/400",
    completedDate: "5 days ago",
    testimonial: {
      text: "Explained all options clearly, great price, and the installation was flawless.",
      author: "Patricia W."
    }
  }
];

export default function FeaturedProjects() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBefore, setShowBefore] = useState(false);

  const currentProject = featuredProjects[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? featuredProjects.length - 1 : prev - 1));
    setShowBefore(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === featuredProjects.length - 1 ? 0 : prev + 1));
    setShowBefore(false);
  };

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Recent Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See the quality of our work through actual projects completed for your neighbors
          </p>
        </div>

        <Card className="max-w-5xl mx-auto overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="relative h-[400px] bg-gray-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${currentProject.id}-${showBefore ? 'before' : 'after'}`}
                    src={showBefore ? currentProject.beforeImage : currentProject.afterImage}
                    alt={`${currentProject.title} - ${showBefore ? 'Before' : 'After'}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Before/After Toggle */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="flex">
                      <button
                        onClick={() => setShowBefore(true)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          showBefore
                            ? "bg-primary text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                        data-testid="button-show-before"
                      >
                        Before
                      </button>
                      <button
                        onClick={() => setShowBefore(false)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          !showBefore
                            ? "bg-primary text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                        data-testid="button-show-after"
                      >
                        After
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10"
                  aria-label="Previous project"
                  data-testid="button-previous-project"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-900" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10"
                  aria-label="Next project"
                  data-testid="button-next-project"
                >
                  <ChevronRight className="h-5 w-5 text-gray-900" />
                </button>

                {/* Photo Credit */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Actual Customer Project
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge>{currentProject.serviceType}</Badge>
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed {currentProject.completedDate}
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentProject.title}
                </h3>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{currentProject.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Completed in {currentProject.duration}</span>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  {currentProject.description}
                </p>

                {currentProject.testimonial && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic mb-2">
                      "{currentProject.testimonial.text}"
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      — {currentProject.testimonial.author}
                    </p>
                  </div>
                )}

                {/* Project Counter */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Project {currentIndex + 1} of {featuredProjects.length}
                    </span>
                    <div className="flex gap-1">
                      {featuredProjects.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentIndex(index);
                            setShowBefore(false);
                          }}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            index === currentIndex ? "bg-primary" : "bg-gray-300"
                          }`}
                          aria-label={`Go to project ${index + 1}`}
                          data-testid={`button-project-${index}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Bar */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Projects Completed", value: "2,847", icon: CheckCircle },
            { label: "This Month", value: "47", icon: Clock },
            { label: "Average Rating", value: "4.9/5", icon: Camera },
            { label: "Years Experience", value: "27+", icon: CheckCircle },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 text-center"
            >
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}