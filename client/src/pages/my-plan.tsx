import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, Calendar, Gift, Users, DollarSign, TrendingUp, 
  Award, Clock, CheckCircle2, Copy, Share2, Mail,
  Phone, Settings, RefreshCw, Star, ChevronRight,
  Home, Wrench, AlertCircle, History, Download,
  Trophy, Target, Zap, Info, Percent, Check
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";

interface MemberData {
  subscription: {
    id: number;
    customerId: number;
    planId: number;
    status: string;
    startDate: string;
    endDate?: string;
    nextInspectionDate?: string;
    lastInspectionDate?: string;
    inspectionsUsed: number;
    totalSavings: number;
    referralCode: string;
    freeMonthsEarned: number;
  };
  plan: {
    name: string;
    tier: string;
    price: number;
    inspectionsPerYear: number;
    discountPercentage: number;
    priorityLevel: string;
    features: string[];
  };
  benefits: Array<{
    id: number;
    benefitType: string;
    usedDate: string;
    amountSaved: number;
    details?: any;
  }>;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function MyPlan() {
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCustomerAuthenticated, setIsCustomerAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  // Check customer authentication state
  useEffect(() => {
    const customerToken = localStorage.getItem('customerToken');
    const customerId = localStorage.getItem('customerId');
    setIsCustomerAuthenticated(!!(customerToken && customerId));
  }, []);

  // Handle customer login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/v1/customer/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail || undefined,
          phone: loginPhone || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customerId', data.customerId.toString());
      
      setIsCustomerAuthenticated(true);
      setShowLoginDialog(false);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.customer.firstName} ${data.customer.lastName}`,
      });
      
      // Refresh the page to load subscription data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch member subscription data from API
  const { data: memberData, isLoading, error } = useQuery<MemberData>({
    queryKey: ['/api/v1/maintenance-plans/subscription'],
    queryFn: async () => {
      const customerToken = localStorage.getItem('customerToken');
      const customerId = localStorage.getItem('customerId');
      
      if (!customerToken || !customerId) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/v1/maintenance-plans/subscription', {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerId');
          setIsCustomerAuthenticated(false);
        }
        throw new Error('Failed to fetch subscription data');
      }

      return response.json();
    },
    enabled: isCustomerAuthenticated,
  });

  // Fallback member data for when real data is not available
  const defaultMemberData: MemberData = {
    subscription: {
      id: 1,
      customerId: 1,
      planId: 2,
      status: 'active',
      startDate: '2024-01-15',
      nextInspectionDate: '2025-01-15',
      lastInspectionDate: '2024-07-15',
      inspectionsUsed: 1,
      totalSavings: 450.75,
      referralCode: 'REF-1-JBROS2024',
      freeMonthsEarned: 1
    },
    plan: {
      name: 'Standard Plan',
      tier: 'standard',
      price: 199,
      inspectionsPerYear: 2,
      discountPercentage: 10,
      priorityLevel: 'priority',
      features: [
        'Bi-annual plumbing inspections',
        'Priority scheduling',
        '10% discount on all services',
        '$99 diagnostic fee waived',
        'Email & SMS maintenance reminders',
        'Quarterly plumbing tips',
        'Seasonal maintenance checklist'
      ]
    },
    benefits: [
      {
        id: 1,
        benefitType: 'inspection',
        usedDate: '2024-07-15',
        amountSaved: 99,
        details: { service: 'Annual Inspection' }
      },
      {
        id: 2,
        benefitType: 'discount',
        usedDate: '2024-08-20',
        amountSaved: 45.00,
        details: { service: 'Drain Cleaning', originalPrice: 450 }
      },
      {
        id: 3,
        benefitType: 'priority',
        usedDate: '2024-09-10',
        amountSaved: 0,
        details: { service: 'Water Heater Repair' }
      },
      {
        id: 4,
        benefitType: 'discount',
        usedDate: '2024-10-05',
        amountSaved: 75.50,
        details: { service: 'Pipe Repair', originalPrice: 755 }
      },
    ],
    customer: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567'
    }
  };

  // Use fetched data or default data
  const displayData = memberData || defaultMemberData;

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(displayData.subscription.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const handleShareReferral = () => {
    const shareUrl = `${window.location.origin}/referral?code=${displayData.subscription.referralCode}`;
    const shareText = `Save on plumbing services with Johnson Bros! Use my referral code ${displayData.subscription.referralCode} for your first month free.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Johnson Bros. Plumbing Referral',
        text: shareText,
        url: shareUrl,
      });
    } else {
      setShowReferralDialog(true);
    }
  };

  const calculateNextInspectionDate = () => {
    if (!displayData.subscription.nextInspectionDate) return 'Schedule Soon';
    const nextDate = new Date(displayData.subscription.nextInspectionDate);
    const daysUntil = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    if (daysUntil <= 30) return `In ${Math.ceil(daysUntil / 7)} weeks`;
    return format(nextDate, 'MMM dd, yyyy');
  };

  const inspectionsRemaining = displayData.plan.inspectionsPerYear - displayData.subscription.inspectionsUsed;
  const membershipDuration = Math.ceil(
    (new Date().getTime() - new Date(displayData.subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const exclusiveDiscounts = [
    { service: 'Water Heater Replacement', discount: '15% off', savings: '$150-300' },
    { service: 'Whole Home Repiping', discount: '20% off', savings: '$500-1000' },
    { service: 'Bathroom Renovation', discount: '15% off', savings: '$300-600' },
    { service: 'Emergency Services', discount: 'Fee waived', savings: '$150' },
    { service: 'Annual Drain Cleaning', discount: 'Free with Premium', savings: '$199' },
  ];

  // Show loading state while fetching authentication status or data
  if (isLoading && isCustomerAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO 
          title="My Plan | Johnson Bros. Plumbing & Heating"
          description="Manage your maintenance plan membership and track your savings."
        />
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading your subscription data...</p>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (!isCustomerAuthenticated || error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO 
          title="My Plan | Johnson Bros. Plumbing & Heating"
          description="Manage your maintenance plan membership and track your savings."
        />
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to view your maintenance plan details.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center space-y-4">
            <p className="text-gray-600">
              To view your maintenance plan details, please sign up for a plan first or contact us if you're already a member.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/maintenance-plans'}>View Plans</Button>
              <Button variant="outline" onClick={() => setShowLoginDialog(true)}>Member Login</Button>
              <Button variant="outline" onClick={() => window.location.href = '/contact'}>Contact Us</Button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="My Maintenance Plan | Johnson Bros. Plumbing & Heating"
        description="Manage your maintenance plan, track savings, and access exclusive member benefits."
      />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-johnson-blue to-johnson-teal text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {displayData.customer?.firstName}!
              </h1>
              <p className="text-xl text-white/90">
                {displayData.plan.name} Member since {format(new Date(displayData.subscription.startDate), 'MMMM yyyy')}
              </p>
            </div>
            <Shield className="w-16 h-16 text-white/80" />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-2 border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Total Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  ${displayData.subscription.totalSavings.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Next Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-blue-600">
                  {calculateNextInspectionDate()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Inspections Left
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {inspectionsRemaining}/{displayData.plan.inspectionsPerYear}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-600" />
                  Free Months
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">
                  {displayData.subscription.freeMonthsEarned}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="plan" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
              <TabsTrigger value="plan">My Plan</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="referral">Referrals</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Plan Details Tab */}
            <TabsContent value="plan">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-johnson-blue" />
                      Your {displayData.plan.name}
                    </CardTitle>
                    <CardDescription>Active since {format(new Date(displayData.subscription.startDate), 'MMM dd, yyyy')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-600">Plan Price</span>
                      <span className="font-semibold">${displayData.plan.price}/year</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-600">Service Discount</span>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        {displayData.plan.discountPercentage}% OFF
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-600">Priority Level</span>
                      <Badge className="capitalize">{displayData.plan.priorityLevel}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-semibold">{membershipDuration} days</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setShowUpgradeDialog(true)}
                      data-testid="button-upgrade-plan"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Plan Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {displayData.plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Schedule Next Inspection */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Schedule Your Next Inspection</CardTitle>
                  <CardDescription>
                    You have {inspectionsRemaining} inspection{inspectionsRemaining !== 1 ? 's' : ''} remaining this year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Last Inspection:</p>
                      <p className="font-semibold">
                        {displayData.subscription.lastInspectionDate 
                          ? format(new Date(displayData.subscription.lastInspectionDate), 'MMMM dd, yyyy')
                          : 'Not yet scheduled'}
                      </p>
                    </div>
                    <Button size="lg" data-testid="button-schedule-inspection">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benefits Tab */}
            <TabsContent value="benefits">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Exclusive Member Discounts</CardTitle>
                    <CardDescription>Special pricing available only to maintenance plan members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exclusiveDiscounts.map((discount, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold">{discount.service}</p>
                            <p className="text-sm text-gray-600">Estimated savings: {discount.savings}</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            {discount.discount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Benefits Usage Summary</CardTitle>
                    <CardDescription>Track how you've used your member benefits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayData.benefits.map((benefit) => (
                        <div key={benefit.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {benefit.benefitType === 'inspection' && <Wrench className="w-5 h-5 text-blue-600" />}
                            {benefit.benefitType === 'discount' && <Percent className="w-5 h-5 text-green-600" />}
                            {benefit.benefitType === 'priority' && <Zap className="w-5 h-5 text-orange-600" />}
                            <div>
                              <p className="font-semibold capitalize">{benefit.benefitType} Used</p>
                              <p className="text-sm text-gray-600">
                                {benefit.details?.service || 'Service'} - {format(new Date(benefit.usedDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          {benefit.amountSaved > 0 && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              Saved ${benefit.amountSaved.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Referral Tab */}
            <TabsContent value="referral">
              <Card>
                <CardHeader className="text-center">
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <CardTitle className="text-2xl">Referral Program</CardTitle>
                  <CardDescription className="text-base">
                    Get 1 month free for every friend who signs up with your referral code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <p className="text-sm text-gray-600 mb-2">Your referral code:</p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 bg-white px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-lg font-bold text-center">
                        {displayData.subscription.referralCode}
                      </code>
                      <Button
                        onClick={handleCopyReferralCode}
                        variant="outline"
                        data-testid="button-copy-referral"
                      >
                        {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                      <Button
                        onClick={handleShareReferral}
                        data-testid="button-share-referral"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-johnson-blue">{displayData.subscription.freeMonthsEarned}</p>
                      <p className="text-sm text-gray-600">Free Months Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">${(displayData.subscription.freeMonthsEarned * 16.58).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total Value</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">∞</p>
                      <p className="text-sm text-gray-600">Referrals Available</p>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Share your code with friends and family. When they sign up for any maintenance plan using your code, 
                      you'll both receive 1 month free!
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.location.href = 'mailto:?subject=Save on Plumbing Services&body=Check out Johnson Bros Plumbing maintenance plans! Use my code ' + displayData.subscription.referralCode}
                    data-testid="button-email-referral"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Referral Code
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Service History & Savings</CardTitle>
                  <CardDescription>Your complete service record as a maintenance plan member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Savings Summary</h3>
                      <Badge className="bg-green-50 text-green-700">
                        Total: ${displayData.subscription.totalSavings.toFixed(2)}
                      </Badge>
                    </div>
                    <Progress value={75} className="h-3 mb-2" />
                    <p className="text-sm text-gray-600">
                      You've saved {((displayData.subscription.totalSavings / displayData.plan.price) * 100).toFixed(0)}% of your annual plan cost
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Annual Inspection</p>
                        <p className="text-sm text-gray-600">July 15, 2024</p>
                      </div>
                      <span className="text-green-600 font-semibold">+$99.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Drain Cleaning (10% off)</p>
                        <p className="text-sm text-gray-600">August 20, 2024</p>
                      </div>
                      <span className="text-green-600 font-semibold">+$45.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Priority Scheduling</p>
                        <p className="text-sm text-gray-600">September 10, 2024</p>
                      </div>
                      <span className="text-blue-600 font-semibold">Priority</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Pipe Repair (10% off)</p>
                        <p className="text-sm text-gray-600">October 5, 2024</p>
                      </div>
                      <span className="text-green-600 font-semibold">+$75.50</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" data-testid="button-download-history">
                    <Download className="w-4 h-4 mr-2" />
                    Download Full History
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Referral Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Referral Code</DialogTitle>
            <DialogDescription>
              Share this link with friends and family
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input 
              value={`${window.location.origin}/referral?code=${displayData.subscription.referralCode}`}
              readOnly
              className="font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/referral?code=${displayData.subscription.referralCode}`);
                  toast({ title: "Link copied!" });
                }}
                data-testid="button-copy-link"
              >
                Copy Link
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setShowReferralDialog(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Get more benefits and save even more with a higher tier plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Contact us at (781) 519-4413 to upgrade your plan and we'll prorate your current plan balance.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => window.location.href = 'tel:7815194413'}
                data-testid="button-call-upgrade"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradeDialog(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Member Login</DialogTitle>
            <DialogDescription>
              Enter your email or phone number to access your maintenance plan
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="john@example.com"
                data-testid="input-login-email"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="(555) 123-4567"
                data-testid="input-login-phone"
              />
            </div>
            
            <DialogFooter>
              <Button
                type="submit"
                disabled={isLoggingIn || (!loginEmail && !loginPhone)}
                data-testid="button-member-login"
              >
                {isLoggingIn ? 'Logging in...' : 'Log In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}