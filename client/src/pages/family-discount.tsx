import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, Star, Shield, Clock, DollarSign, Users,
  CheckCircle2, Calendar, Gift, Heart, Phone,
  Zap, ChevronRight, Award
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FamilyDiscount() {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/v1/family-discount/subscribe", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've successfully joined The Family Discount! Check your email for details.",
      });
      setShowSignupDialog(false);
      setLocation("/my-plan");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again or call us at (617) 479-9911.",
        variant: "destructive",
      });
    }
  });

  const benefits = [
    {
      icon: Clock,
      title: "Priority Scheduling",
      description: "Jump to the front of the line when you need service"
    },
    {
      icon: DollarSign,
      title: "No Service Fees",
      description: "Save $99 on every service call - that's your membership paid for with just one visit!"
    },
    {
      icon: Award,
      title: "10% Off All Jobs",
      description: "Receive 10% discount on all plumbing repairs and installations"
    },
    {
      icon: Gift,
      title: "Share the Savings",
      description: "Give The Family Discount to a friend or family member - one free transfer per year"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <SEO 
        title="The Family Discount | Johnson Bros. Plumbing & Heating"
        description="Join The Family Discount for just $99/year. Get priority scheduling, no service fees, and 10% off all plumbing jobs."
      />
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/40 text-base px-4 py-2">
              <Heart className="w-5 h-5 mr-2" />
              Treat Your Home Like Family
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The Family Discount
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join our family of homeowners who save money and get priority service for just $99 a year
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full text-lg">
                <CheckCircle2 className="w-6 h-6" />
                <span>Priority Service</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full text-lg">
                <DollarSign className="w-6 h-6" />
                <span>No Service Fees</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full text-lg">
                <Award className="w-6 h-6" />
                <span>10% Off Everything</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/80 text-lg mb-4">Only</p>
              <div className="inline-block bg-white/10 backdrop-blur-sm px-12 py-6 rounded-2xl border-2 border-white/30">
                <p className="text-6xl font-bold">$99</p>
                <p className="text-2xl text-white/90">/year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You Get
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to protect your home and save money
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="hover:shadow-xl transition-shadow border-2">
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-br from-johnson-blue to-johnson-teal rounded-full flex items-center justify-center text-white mb-4">
                      <Icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-johnson-orange/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 text-center">
              <CardTitle className="text-3xl mb-2">Pay For Itself With One Visit</CardTitle>
              <CardDescription className="text-lg">See how The Family Discount saves you money</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Without Family Discount</p>
                  <p className="text-lg text-gray-700 mb-2">One Service Call</p>
                  <p className="text-4xl font-bold text-red-600 mb-2">$99</p>
                  <p className="text-sm text-gray-600">Service fee per visit</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-700">$250 drain cleaning</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">Total: $349</p>
                  </div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                  <p className="text-gray-700 font-semibold mb-2">With Family Discount</p>
                  <p className="text-lg text-gray-700 mb-2">One Service Call</p>
                  <p className="text-4xl font-bold text-green-600 mb-2">$0</p>
                  <p className="text-sm text-gray-600">No service fee!</p>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-gray-700">$250 drain cleaning</p>
                    <p className="text-sm text-green-700">- $25 (10% discount)</p>
                    <p className="text-2xl font-bold text-green-700 mt-2">Total: $225</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-300">
                    <p className="text-sm font-semibold text-green-700">You Save $124 on just one visit!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join the Family
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by homeowners across Massachusetts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-johnson-blue mx-auto mb-4" />
                <CardTitle className="text-4xl font-bold text-johnson-blue">500+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Active Members</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-4xl font-bold text-green-600">$350</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Average Annual Savings</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4 fill-current" />
                <CardTitle className="text-4xl font-bold text-gray-900">4.8/5</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Member Satisfaction</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-johnson-blue to-johnson-teal text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Join The Family?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start saving money and getting priority service today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setShowSignupDialog(true)}
              className="bg-johnson-orange hover:bg-johnson-orange/90 text-white text-lg px-8 py-6"
              data-testid="button-join-family-discount"
            >
              Join Now for $99/Year
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-6"
              onClick={() => window.location.href = 'tel:6174799911'}
            >
              <Phone className="w-5 h-5 mr-2" />
              Call to Learn More
            </Button>
          </div>
          <p className="text-white/70 mt-6 text-sm">
            Questions? Call us at (617) 479-9911 - we're happy to help!
          </p>
        </div>
      </section>

      {/* Sign-up Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join The Family Discount</DialogTitle>
            <DialogDescription>
              Enter your information to get started - we'll contact you to complete your enrollment
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              signupMutation.mutate({
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
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
              className="w-full bg-johnson-orange hover:bg-johnson-orange/90"
              disabled={signupMutation.isPending}
              data-testid="button-confirm-signup"
            >
              {signupMutation.isPending ? 'Processing...' : 'Join The Family Discount'}
            </Button>
            
            <p className="text-sm text-gray-600 text-center">
              By submitting, you agree to receive communications about The Family Discount program.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
