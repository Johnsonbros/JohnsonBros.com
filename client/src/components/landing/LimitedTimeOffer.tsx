import { Clock, Calendar, AlertCircle, TrendingUp, Gift, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface LimitedTimeOfferProps {
  onBookService: () => void;
  offerEndDate?: Date;
  offerTitle?: string;
  offerDescription?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    originalPrice?: number;
  };
  showProgress?: boolean;
  spotsAvailable?: number;
  totalSpots?: number;
  urgencyLevel?: 'low' | 'medium' | 'high';
}

export function LimitedTimeOffer({
  onBookService,
  offerEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  offerTitle = "Limited Time Offer",
  offerDescription = "Book now and save on your plumbing service",
  discount = {
    type: 'fixed',
    value: 99,
    originalPrice: 199
  },
  showProgress = true,
  spotsAvailable = 3,
  totalSpots = 10,
  urgencyLevel = 'high'
}: LimitedTimeOfferProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [spots, setSpots] = useState(spotsAvailable);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = offerEndDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [offerEndDate]);

  // Simulate spots being taken
  useEffect(() => {
    if (spots <= 0) return;
    
    const interval = setInterval(() => {
      const random = Math.random();
      if (random < 0.1 && spots > 1) { // 10% chance every 30 seconds
        setSpots(prev => Math.max(1, prev - 1));
        setPulseAnimation(true);
        setTimeout(() => setPulseAnimation(false), 1000);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [spots]);

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'high': return 'from-red-500 to-orange-600';
      case 'medium': return 'from-orange-500 to-yellow-600';
      default: return 'from-blue-500 to-cyan-600';
    }
  };

  const getDiscountDisplay = () => {
    if (discount.type === 'percentage') {
      return `${discount.value}% OFF`;
    } else {
      return `Save $${discount.value}`;
    }
  };

  const progressPercentage = ((totalSpots - spots) / totalSpots) * 100;

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <Card className={`overflow-hidden shadow-2xl ${pulseAnimation ? 'animate-pulse' : ''}`}>
          {/* Gradient Header */}
          <div className={`bg-gradient-to-r ${getUrgencyColor()} text-white p-6 sm:p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {urgencyLevel === 'high' && (
                    <Badge className="bg-red-600 text-white animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      HOT DEAL
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    LIMITED TIME
                  </Badge>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black mb-2">
                  {offerTitle}
                </h2>
                
                <p className="text-white/90 mb-4">
                  {offerDescription}
                </p>

                {/* Discount Display */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black">
                    {getDiscountDisplay()}
                  </span>
                  {discount.originalPrice && (
                    <span className="text-white/70 line-through text-lg">
                      ${discount.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Timer Display */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                <p className="text-xs text-white/80 mb-2">OFFER ENDS IN</p>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-2xl font-bold tabular-nums">{String(timeLeft.days).padStart(2, '0')}</div>
                    <div className="text-xs text-white/70">DAYS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-xs text-white/70">HRS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-xs text-white/70">MIN</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-xs text-white/70">SEC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 bg-white">
            {/* Availability Progress */}
            {showProgress && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Booking Fast!
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    Only {spots} spots left
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  {totalSpots - spots} of {totalSpots} spots claimed
                </p>
              </div>
            )}

            {/* Offer Details */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Instant Savings</p>
                  <p className="text-xs text-gray-600">Applied at checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Flexible Booking</p>
                  <p className="text-xs text-gray-600">Choose your time</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">No Hidden Fees</p>
                  <p className="text-xs text-gray-600">Transparent pricing</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  sessionStorage.setItem('limited_offer', JSON.stringify({
                    discount,
                    expiresAt: offerEndDate.toISOString()
                  }));
                  onBookService();
                }}
                size="lg"
                className="flex-1 bg-gradient-to-r from-johnson-orange to-orange-500 hover:from-orange-500 hover:to-johnson-orange text-white font-bold shadow-lg transform hover:scale-105 transition-all"
              >
                <Gift className="mr-2 h-5 w-5" />
                Claim This Offer Now
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="sm:w-auto"
                onClick={() => document.getElementById('offer-details')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Details
              </Button>
            </div>

            {/* Urgency Message */}
            {urgencyLevel === 'high' && spots <= 3 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  High demand warning: {spots} customers are viewing this offer now
                </p>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-gray-500 mt-4 text-center">
              *Offer valid until {offerEndDate.toLocaleDateString()} or while supplies last. 
              Cannot be combined with other offers. Terms and conditions apply.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}