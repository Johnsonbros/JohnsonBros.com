import { Link } from "wouter";
import { getNearbyTownNames, type ServiceAreaSlug } from "@/lib/serviceAreaAdjacency";

interface NearbyServiceAreasProps {
  currentArea: ServiceAreaSlug;
  className?: string;
}

/**
 * Displays a grid of links to nearby service areas.
 * Uses the centralized adjacency map to ensure all links are valid.
 */
export function NearbyServiceAreas({ currentArea, className = "" }: NearbyServiceAreasProps) {
  const nearbyTowns = getNearbyTownNames(currentArea);

  if (nearbyTowns.length === 0) return null;

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            We Also Serve Nearby Communities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {nearbyTowns.map((town) => (
              <Link
                key={town}
                href={`/service-areas/${town.toLowerCase().replace(/ /g, '-')}`}
                className="text-johnson-blue hover:text-johnson-teal font-medium p-2 rounded hover:bg-gray-50 transition-colors"
              >
                {town}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NearbyServiceAreas;
