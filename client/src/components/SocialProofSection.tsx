import { RecentJobsWidget } from "./RecentJobsWidget";
import { StatsWidget } from "./StatsWidget";
import { ServiceHeatMap } from "./ServiceHeatMap";

interface SocialProofSectionProps {
  onBookService?: () => void;
}

export function SocialProofSection({ onBookService }: SocialProofSectionProps) {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-green-50 bg-pipes-orange relative" style={{ backgroundBlendMode: 'multiply' }} data-testid="social-proof-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4" data-testid="social-proof-title">
            Serving Massachusetts with Excellence
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="social-proof-subtitle">
            Discover our service coverage across Massachusetts and see why thousands of customers trust us with their plumbing needs.
          </p>
        </div>

        {/* Main social proof grid */}
        <div className="grid gap-6 md:gap-8 lg:gap-10">
          {/* Heat Map - Full Width */}
          <div className="animate-fade-in-up flex justify-center" style={{ animationDelay: '0.1s' }}>
            <ServiceHeatMap onBookService={onBookService} />
          </div>

          {/* Success Story & Recent Completions - Side by Side on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
            <div className="animate-fade-in-up flex justify-center" style={{ animationDelay: '0.2s' }}>
              <StatsWidget />
            </div>
            <div className="animate-fade-in-up flex justify-center" style={{ animationDelay: '0.3s' }}>
              <RecentJobsWidget />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}