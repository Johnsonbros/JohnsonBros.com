import { CheckCircle, Star, DollarSign, Calendar, ArrowRight, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface ServiceHeroProps {
  onBookService: () => void;
  serviceName: string;
  headline: string;
  subheadline: string;
  price?: string;
  features?: string[];
  beforeImage?: string;
  afterImage?: string;
  rating?: number;
  reviewCount?: number;
}

export function ServiceHero({
  onBookService,
  serviceName,
  headline,
  subheadline,
  price = "$99",
  features = [
    "Professional diagnosis",
    "Upfront pricing",
    "Same-day service",
    "Satisfaction guaranteed"
  ],
  beforeImage = "https://images.unsplash.com/photo-1565043666747-69f6646db940?q=80&w=2000",
  afterImage = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2000",
  rating = 4.9,
  reviewCount = 247
}: ServiceHeroProps) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <section className="bg-gradient-to-br from-johnson-blue via-blue-700 to-johnson-teal text-white py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/blue-pipes-bg.png')] bg-repeat" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            {/* Service Badge */}
            <Badge className="bg-johnson-orange text-white mb-4 px-4 py-2 text-sm font-bold inline-flex items-center gap-2">
              <Award className="h-4 w-4" />
              {serviceName.toUpperCase()}
            </Badge>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {headline}
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl mb-6 text-blue-100">
              {subheadline}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                  />
                ))}
                <span className="ml-2 font-bold text-yellow-400">{rating}</span>
              </div>
              <span className="text-blue-100">({reviewCount} reviews)</span>
            </div>

            {/* Service Features */}
            <Card className="bg-white/10 backdrop-blur border-white/20 p-6 mb-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pricing Card */}
            <Card className="bg-gradient-to-r from-johnson-orange to-orange-500 p-6 mb-6 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Service starts at:</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{price}</span>
                    <span className="text-white/80">+ parts</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Clock className="h-3 w-3 mr-1" />
                    Same Day Available
                  </Badge>
                </div>
              </div>
            </Card>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onBookService}
                size="lg"
                className="bg-white text-johnson-blue hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-xl transform hover:scale-105 transition-all duration-200"
                data-testid="service-book-now"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book This Service
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-johnson-blue font-bold text-lg px-8 py-6"
                onClick={() => document.getElementById('pricing-calculator')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="service-estimate"
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Get Free Estimate
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm">100% Satisfaction</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm">Upfront Pricing</span>
              </div>
            </div>
          </div>

          {/* Right Column - Before/After Showcase */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Before/After Toggle */}
              <div className="bg-gray-100 p-2 flex">
                <button
                  onClick={() => setShowAfter(false)}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-all ${
                    !showAfter 
                      ? 'bg-johnson-blue text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid="show-before"
                >
                  Before
                </button>
                <button
                  onClick={() => setShowAfter(true)}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-all ${
                    showAfter 
                      ? 'bg-johnson-blue text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid="show-after"
                >
                  After
                </button>
              </div>

              {/* Images */}
              <div className="relative h-[400px] bg-gray-200">
                <img
                  src={showAfter ? afterImage : beforeImage}
                  alt={showAfter ? "After service" : "Before service"}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                
                {/* Overlay Label */}
                <div className="absolute top-4 left-4">
                  <Badge className={`${showAfter ? 'bg-green-500' : 'bg-red-500'} text-white px-3 py-1 font-bold`}>
                    {showAfter ? 'AFTER' : 'BEFORE'}
                  </Badge>
                </div>
              </div>

              {/* Service Stats */}
              <div className="p-6 bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-4">Why Choose Our {serviceName}?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-johnson-blue">30min</div>
                    <div className="text-xs text-gray-600">Avg Response</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-johnson-blue">98%</div>
                    <div className="text-xs text-gray-600">Happy Customers</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-johnson-blue">5yr</div>
                    <div className="text-xs text-gray-600">Warranty</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-johnson-blue">24/7</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Price Tag */}
            <div className="absolute -top-4 -right-4 bg-johnson-orange text-white rounded-full p-4 shadow-2xl">
              <div className="text-center">
                <div className="text-xs font-medium">FROM</div>
                <div className="text-2xl font-black">{price}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}