import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, Star, Shield, Clock, DollarSign, TrendingUp, 
  Award, Users, Calculator, ChevronRight, Sparkles,
  CheckCircle2, Calendar, Wrench, Phone, Gift, Heart,
  RefreshCw, Zap, Bell, Save
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface MaintenancePlan {
  id: number;
  name: string;
  tier: string;
  price: number;
  billingCycle: string;
  inspectionsPerYear: number;
  discountPercentage: number;
  priorityLevel: string;
  features: string[];
  description: string;
  isActive: boolean;
}

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  plan: string;
  savingsAmount: string;
}

export default function MaintenancePlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [averageServiceCost, setAverageServiceCost] = useState([150]);
  const [servicesPerYear, setServicesPerYear] = useState([3]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch maintenance plans
  const { data: plans, isLoading } = useQuery<MaintenancePlan[]>({
    queryKey: ["/api/v1/maintenance-plans"],
    queryFn: async () => {
      const response = await fetch("/api/v1/maintenance-plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    }
  });

  // Mock testimonials data
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Mitchell",
      location: "Quincy, MA",
      rating: 5,
      text: "The Standard Plan has saved us over $500 this year! The bi-annual inspections caught a small leak before it became a major problem.",
      plan: "Standard Plan",
      savingsAmount: "$500+"
    },
    {
      name: "Robert Chen",
      location: "Hingham, MA",
      rating: 5,
      text: "Premium Plan member for 2 years. The 20% discount and priority service during our emergency was invaluable. Best investment for homeowners!",
      plan: "Premium Plan",
      savingsAmount: "$1,200+"
    },
    {
      name: "Maria Santos",
      location: "Weymouth, MA",
      rating: 5,
      text: "Love the Basic Plan! Annual inspection gives me peace of mind, and priority scheduling means I never wait long for service.",
      plan: "Basic Plan",
      savingsAmount: "$200+"
    }
  ];

  // Calculate potential savings
  const calculateSavings = (plan: MaintenancePlan) => {
    const avgCost = averageServiceCost[0];
    const numServices = servicesPerYear[0];
    const yearlyServiceCost = avgCost * numServices;
    const discountSavings = (yearlyServiceCost * plan.discountPercentage) / 100;
    const inspectionValue = plan.inspectionsPerYear * 99; // $99 diagnostic fee per inspection
    const totalSavings = discountSavings + inspectionValue;
    const netSavings = totalSavings - plan.price;
    return {
      discountSavings,
      inspectionValue,
      totalSavings,
      netSavings,
      yearlyServiceCost
    };
  };

  const handleSignUp = (planTier: string) => {
    setSelectedPlan(planTier);
    setShowSignupDialog(true);
  };

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/v1/maintenance-plans/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've successfully signed up for the maintenance plan. Check your email for details.",
      });
      setShowSignupDialog(false);
      setLocation("/my-plan");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getPlanIcon = (tier: string) => {
    switch(tier) {
      case 'basic': return Shield;
      case 'standard': return Award;
      case 'premium': return Sparkles;
      default: return Shield;
    }
  };

  const getPlanColor = (tier: string) => {
    switch(tier) {
      case 'basic': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'standard': return 'bg-green-50 border-green-200 text-green-900';
      case 'premium': return 'bg-purple-50 border-purple-200 text-purple-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Maintenance Plans | Johnson Bros. Plumbing & Heating"
        description="Save money and protect your home with our maintenance plans. Annual inspections, priority service, and member discounts starting at $99/year."
      />
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/40">
              <Gift className="w-4 h-4 mr-1" />
              Limited Time: First Month Free
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Protect Your Home Year-Round
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join thousands of homeowners who save money and avoid emergencies with our maintenance plans
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>No Hidden Fees</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span>Priority Service</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Save className="w-5 h-5" />
                <span>Save Up to 20%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Calculator */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-johnson-orange/20">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center gap-3">
                <Calculator className="w-8 h-8 text-johnson-orange" />
                <div>
                  <CardTitle className="text-2xl">Calculate Your Savings</CardTitle>
                  <CardDescription>See how much you could save with a maintenance plan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base mb-2 block">
                    Average cost per service call: ${averageServiceCost[0]}
                  </Label>
                  <Slider
                    value={averageServiceCost}
                    onValueChange={setAverageServiceCost}
                    min={50}
                    max={500}
                    step={10}
                    className="mb-6"
                    data-testid="slider-service-cost"
                  />
                </div>
                <div>
                  <Label className="text-base mb-2 block">
                    Services needed per year: {servicesPerYear[0]}
                  </Label>
                  <Slider
                    value={servicesPerYear}
                    onValueChange={setServicesPerYear}
                    min={1}
                    max={10}
                    step={1}
                    className="mb-6"
                    data-testid="slider-services-per-year"
                  />
                </div>
              </div>

              {plans && (
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                  {plans.map((plan) => {
                    const savings = calculateSavings(plan);
                    return (
                      <div key={plan.id} className={`p-4 rounded-lg border-2 ${getPlanColor(plan.tier)}`}>
                        <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p>Service discount: ${savings.discountSavings.toFixed(0)}</p>
                          <p>Free inspections: ${savings.inspectionValue}</p>
                          <p className="font-bold text-base pt-2 border-t mt-2">
                            {savings.netSavings > 0 ? (
                              <span className="text-green-700">You save: ${savings.netSavings.toFixed(0)}/year</span>
                            ) : (
                              <span>Plan cost: ${plan.price}/year</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plans Comparison */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Protection Level
            </h2>
            <p className="text-xl text-gray-600">
              All plans include priority scheduling and waived diagnostic fees
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading plans...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {plans?.map((plan) => {
                const Icon = getPlanIcon(plan.tier);
                const isPopular = plan.tier === 'standard';
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative hover:shadow-xl transition-shadow ${
                      isPopular ? 'border-2 border-johnson-orange shadow-lg' : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-johnson-orange text-white px-4 py-1">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-johnson-blue to-johnson-teal rounded-full flex items-center justify-center text-white mb-4">
                        <Icon className="w-8 h-8" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-base">{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="text-center mb-6">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      
                      <div className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Inspections/year:</span>
                          <span className="font-semibold">{plan.inspectionsPerYear}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service discount:</span>
                          <span className="font-semibold">{plan.discountPercentage}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Priority level:</span>
                          <Badge variant="secondary" className="capitalize">
                            {plan.priorityLevel}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className={`w-full ${
                          isPopular 
                            ? 'bg-johnson-orange hover:bg-johnson-orange/90' 
                            : ''
                        }`}
                        size="lg"
                        onClick={() => handleSignUp(plan.tier)}
                        data-testid={`button-signup-${plan.tier}`}
                      >
                        Get Started
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Members Are Saying
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied maintenance plan members
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-lg">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      Saved {testimonial.savingsAmount}
                    </Badge>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {testimonial.plan}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
              <Users className="w-8 h-8 text-johnson-blue" />
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-900">2,500+</p>
                <p className="text-sm text-gray-600">Active Members</p>
              </div>
              <div className="border-l pl-4">
                <p className="text-2xl font-bold text-green-600">$450</p>
                <p className="text-sm text-gray-600">Avg. Annual Savings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose a Maintenance Plan?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Save Money</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Member discounts and free inspections save hundreds annually
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Prevent Emergencies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Regular inspections catch problems before they become costly repairs
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Priority Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Jump to the front of the line when you need service
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Peace of Mind</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Rest easy knowing your plumbing is professionally maintained
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sign-up Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Up for {selectedPlan?.replace('-', ' ')} Plan</DialogTitle>
            <DialogDescription>
              Enter your information to get started with your maintenance plan
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              signupMutation.mutate({
                planTier: selectedPlan,
                email: formData.get('email'),
                phone: formData.get('phone'),
                name: formData.get('name'),
              });
            }}
            className="space-y-4 mt-4"
          >
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name"
                name="name"
                required
                placeholder="John Smith"
                data-testid="input-signup-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                data-testid="input-signup-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="(555) 123-4567"
                data-testid="input-signup-phone"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={signupMutation.isPending}
              data-testid="button-confirm-signup"
            >
              {signupMutation.isPending ? 'Processing...' : 'Complete Sign Up'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}