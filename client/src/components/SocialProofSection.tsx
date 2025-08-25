import { RecentJobsWidget } from "./RecentJobsWidget";
import { StatsWidget } from "./StatsWidget";
import { LiveActivityWidget } from "./LiveActivityWidget";
import { TestimonialsWidget } from "./TestimonialsWidget";

export function SocialProofSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="social-proof-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4" data-testid="social-proof-title">
            Trusted by Thousands of Happy Customers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="social-proof-subtitle">
            See what's happening right now and why families across the region choose Johnson Brothers for their plumbing needs.
          </p>
        </div>

        {/* Main social proof grid */}
        <div className="grid gap-6 md:gap-8 lg:gap-10">
          {/* Top row - Stats and Recent Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <StatsWidget />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <RecentJobsWidget />
            </div>
          </div>

          {/* Bottom row - Live Activity and Testimonials */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <LiveActivityWidget />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <TestimonialsWidget />
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center px-6 py-3 bg-white rounded-full shadow-lg border animate-fade-in-up" style={{ animationDelay: '0.5s' }} data-testid="trust-indicator">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Live Updates</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">🔒 Real Customer Data</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">⭐ 5.0 Average Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}