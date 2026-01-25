import { useEffect, useState, useRef, RefObject } from "react";
import { Shield, Clock, Users, Wrench, Star, Home, TrendingUp, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInView } from "framer-motion";

interface CounterData {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
}

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

function AnimatedCounter({ end, duration = 2000, suffix = "", className = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as RefObject<Element>, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = progress * (2 - progress);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuad);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isInView]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function WhyTrustUs() {
  const counters: CounterData[] = [
    {
      label: "Years in Business",
      value: 27,
      suffix: "+",
      icon: <Home className="h-10 w-10" />,
      color: "text-blue-600"
    },
    {
      label: "Jobs Completed",
      value: 10000,
      suffix: "+",
      icon: <Wrench className="h-10 w-10" />,
      color: "text-green-600"
    },
    {
      label: "Happy Customers",
      value: 5000,
      suffix: "+",
      icon: <Users className="h-10 w-10" />,
      color: "text-purple-600"
    },
    {
      label: "Avg Response Time",
      value: 2,
      suffix: " hrs",
      icon: <Clock className="h-10 w-10" />,
      color: "text-red-600"
    }
  ];

  const trustPoints = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "$2 Million Insurance Coverage",
      description: "Full liability and property damage protection for your peace of mind"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "MA License #PC1673",
      description: "State-certified master plumbers with continuous training"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "BBB A+ Accredited",
      description: "Maintaining the highest standards since 2009"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Family Legacy Since 2008",
      description: "Trusted plumbing excellence for over 15 years"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-johnson-orange text-white text-sm px-4 py-2">
            WHY TRUST US
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Johnson Bros Difference
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trusted by thousands of Massachusetts families for quality plumbing services that stand the test of time
          </p>
        </div>

        {/* Animated Counters Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {counters.map((counter, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white"
            >
              <CardContent className="p-6">
                <div className={`${counter.color} mb-4 flex justify-center`}>
                  {counter.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter
                    end={counter.value}
                    suffix={counter.suffix}
                  />
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {counter.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Points Grid */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Licensed, Insured & Bonded Protection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trustPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-johnson-orange bg-orange-50 p-3 rounded-lg flex-shrink-0">
                  {point.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{point.title}</h4>
                  <p className="text-gray-600 text-sm">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Guarantee Banner */}
        <div className="bg-gradient-to-r from-johnson-blue to-johnson-teal rounded-xl p-8 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="h-16 w-16 mx-auto mb-4 text-white/90" />
            <h3 className="text-3xl font-bold mb-4">
              Our Iron-Clad Guarantee
            </h3>
            <p className="text-lg mb-6 text-blue-100">
              We stand behind every job with our 100% satisfaction guarantee. If you're not completely satisfied,
              we'll make it right or refund your service fee - no questions asked.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>1-Year Warranty on Labor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>Manufacturer Warranty on Parts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>Price Match Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>No Hidden Fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}