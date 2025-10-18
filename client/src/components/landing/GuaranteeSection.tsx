import { Shield, Clock, DollarSign, Award, CheckCircle, Wrench, Heart, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Guarantee {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

interface GuaranteeSectionProps {
  guarantees?: Guarantee[];
  layout?: 'grid' | 'stacked' | 'centered';
  showSeal?: boolean;
}

const defaultGuarantees: Guarantee[] = [
  {
    icon: <Shield className="h-6 w-6 text-green-600" />,
    title: "100% Satisfaction Guarantee",
    description: "If you're not completely satisfied with our service, we'll make it right or refund your service fee",
    highlight: "No questions asked"
  },
  {
    icon: <Clock className="h-6 w-6 text-blue-600" />,
    title: "On-Time Promise",
    description: "We arrive within the scheduled window or your service call is free",
    highlight: "Guaranteed arrival"
  },
  {
    icon: <DollarSign className="h-6 w-6 text-purple-600" />,
    title: "Upfront Pricing",
    description: "No hidden fees or surprise charges. Price approved before work begins",
    highlight: "No surprises"
  },
  {
    icon: <Wrench className="h-6 w-6 text-orange-600" />,
    title: "1-Year Workmanship Warranty",
    description: "All repairs backed by our comprehensive warranty on parts and labor",
    highlight: "Peace of mind"
  }
];

export function GuaranteeSection({
  guarantees = defaultGuarantees,
  layout = 'grid',
  showSeal = true
}: GuaranteeSectionProps) {
  if (layout === 'centered') {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-600 text-white text-sm px-4 py-2">
              OUR PROMISE TO YOU
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Johnson Brothers Guarantee
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We stand behind our work with industry-leading guarantees that protect you and your investment
            </p>
          </div>

          {/* Central Guarantee Seal */}
          {showSeal && (
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="w-48 h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-2xl flex items-center justify-center animate-pulse-slow">
                  <div className="text-center text-white">
                    <Award className="h-16 w-16 mx-auto mb-2" />
                    <div className="font-black text-lg">100%</div>
                    <div className="text-sm font-bold">GUARANTEED</div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Guarantees Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {guarantees.map((guarantee, index) => (
              <Card 
                key={index}
                className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 text-center"
                data-testid={`guarantee-${index}`}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full">
                    {guarantee.icon}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{guarantee.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{guarantee.description}</p>
                {guarantee.highlight && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {guarantee.highlight}
                  </Badge>
                )}
              </Card>
            ))}
          </div>

          {/* Trust Message */}
          <div className="mt-12 text-center p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 text-gray-700">
              <Heart className="h-6 w-6 text-red-500" />
              <p className="font-medium">
                Serving our community with pride for over 15 years • 5,000+ happy customers
              </p>
              <ThumbsUp className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'stacked') {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Service Guarantees</h2>
              <p className="text-gray-600">Your satisfaction is our top priority</p>
            </div>

            <div className="space-y-4">
              {guarantees.map((guarantee, index) => (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow duration-200"
                  data-testid={`guarantee-stacked-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-gradient-to-br from-johnson-blue/10 to-johnson-orange/10 rounded-lg">
                      {guarantee.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 text-lg">{guarantee.title}</h3>
                      <p className="text-gray-600">{guarantee.description}</p>
                      {guarantee.highlight && (
                        <Badge variant="secondary" className="mt-2">
                          ✓ {guarantee.highlight}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Grid layout (default)
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-johnson-blue text-white">PEACE OF MIND</Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Iron-Clad Guarantees</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're so confident in our service quality that we back every job with these guarantees
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guarantees.map((guarantee, index) => (
            <Card 
              key={index}
              className="p-5 hover:shadow-xl transition-all duration-200 group hover:-translate-y-1"
              data-testid={`guarantee-grid-${index}`}
            >
              <div className="mb-4">
                <div className="inline-flex p-3 bg-gradient-to-br from-johnson-blue/10 to-johnson-orange/10 rounded-lg group-hover:scale-110 transition-transform">
                  {guarantee.icon}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{guarantee.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{guarantee.description}</p>
              {guarantee.highlight && (
                <div className="text-sm font-medium text-johnson-blue">
                  ✓ {guarantee.highlight}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        {showSeal && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="text-left">
                <p className="font-bold text-gray-900">Risk-Free Service</p>
                <p className="text-sm text-gray-600">All work backed by our comprehensive guarantees</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}