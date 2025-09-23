import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Gift, Users, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

// Customer lookup schema
const customerLookupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

// Referral form schema
const referralFormSchema = z.object({
  referredName: z.string().min(1, "Name is required"),
  referredPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  referredEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  referredAddress: z.string().optional(),
  referredCity: z.string().optional(),
  referredState: z.string().optional(),
  referredZip: z.string().optional(),
  serviceNeeded: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerLookupData = z.infer<typeof customerLookupSchema>;
type ReferralFormData = z.infer<typeof referralFormSchema>;

export default function Referral() {
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const { toast } = useToast();

  // Customer lookup form
  const lookupForm = useForm<CustomerLookupData>({
    resolver: zodResolver(customerLookupSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
    },
  });

  // Referral form
  const referralForm = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      referredName: "",
      referredPhone: "",
      referredEmail: "",
      referredAddress: "",
      referredCity: "Quincy",
      referredState: "MA",
      referredZip: "",
      serviceNeeded: "",
      notes: "",
    },
  });

  // Customer lookup mutation
  const lookupMutation = useMutation({
    mutationFn: async (data: CustomerLookupData) => {
      const params = new URLSearchParams();
      params.append("firstName", data.firstName);
      params.append("lastName", data.lastName);
      if (data.email) params.append("email", data.email);
      if (data.phone) params.append("phone", data.phone);
      
      const response = await apiRequest("GET", `/api/customers/lookup?${params.toString()}`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.customer) {
        setCurrentCustomer(data.customer);
        setLookupError(null);
        toast({
          title: "Customer Found",
          description: `Welcome back, ${data.customer.first_name} ${data.customer.last_name}!`,
        });
      } else {
        setCurrentCustomer(null);
        setLookupError("Customer not found. Please check your information and try again.");
      }
    },
    onError: () => {
      setCurrentCustomer(null);
      setLookupError("An error occurred while looking up your information. Please try again.");
    },
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      if (!currentCustomer) throw new Error("No customer selected");
      
      const response = await apiRequest("POST", "/api/referrals", {
        referrerCustomerId: currentCustomer.id,
        referrerName: `${currentCustomer.first_name} ${currentCustomer.last_name}`,
        referrerPhone: currentCustomer.mobile_number || currentCustomer.home_number,
        ...data,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Referral Submitted!",
        description: "Thank you for referring a friend! They'll receive $99 off their first service, and you'll earn $50 credit when they complete their booking.",
      });
      referralForm.reset();
      // Invalidate any referral queries
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit referral. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch existing referrals if customer is logged in
  const { data: referralsData, isLoading: referralsLoading } = useQuery<{ success: boolean; referrals: any[] }>({
    queryKey: ["/api/referrals", currentCustomer?.id],
    enabled: !!currentCustomer?.id,
  });

  const handleCustomerLookup = (data: CustomerLookupData) => {
    setIsLookingUp(true);
    lookupMutation.mutate(data);
    setIsLookingUp(false);
  };

  const handleReferralSubmit = (data: ReferralFormData) => {
    createReferralMutation.mutate(data);
  };

  return (
    <>
      <SEO
        title="Referral Program | Johnson Bros. Plumbing & Drain Cleaning"
        description="Refer friends and family to Johnson Bros. Plumbing and earn rewards! Get $50 credit for each referral, and your friend saves $99 on their first service."
        keywords={["referral program", "plumbing referral", "earn rewards", "discount plumbing", "Quincy MA"]}
        url="/referral"
        type="website"
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Refer Friends, Earn Rewards
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Share the exceptional service you've experienced with Johnson Bros. Plumbing. 
              Your friends save $99, and you earn $50 credit for each successful referral!
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card data-testid="card-benefit-friend">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Gift className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold">Friend Saves $99</h3>
                </div>
                <p className="text-gray-600">
                  Your referred friend receives an instant $99 discount on their first service.
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-benefit-credit">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-semibold">You Earn $50</h3>
                </div>
                <p className="text-gray-600">
                  Receive $50 credit toward your next service when your referral completes their booking.
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-benefit-unlimited">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <h3 className="text-lg font-semibold">Unlimited Referrals</h3>
                </div>
                <p className="text-gray-600">
                  No limits on referrals - the more friends you refer, the more you earn!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {!currentCustomer ? (
            <Card data-testid="card-customer-lookup">
              <CardHeader>
                <CardTitle>Step 1: Find Your Account</CardTitle>
                <CardDescription>
                  Enter your information to access your referral dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...lookupForm}>
                  <form onSubmit={lookupForm.handleSubmit(handleCustomerLookup)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={lookupForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} data-testid="input-firstname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={lookupForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} data-testid="input-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={lookupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john@example.com" 
                                {...field} 
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormDescription>
                              Provide either email or phone number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={lookupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="617-555-1234" 
                                {...field} 
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormDescription>
                              10-digit phone number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {lookupError && (
                      <Alert variant="destructive" data-testid="alert-lookup-error">
                        <AlertTitle>Not Found</AlertTitle>
                        <AlertDescription>{lookupError}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={lookupMutation.isPending}
                      className="w-full md:w-auto"
                      data-testid="button-lookup"
                    >
                      {lookupMutation.isPending ? "Looking up..." : "Find My Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Customer Info Banner */}
              <Alert data-testid="alert-customer-info">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Welcome back, {currentCustomer.first_name}!</AlertTitle>
                <AlertDescription>
                  You can now refer friends and track your referral rewards.
                </AlertDescription>
              </Alert>

              {/* Existing Referrals */}
              {referralsData?.referrals?.length > 0 && (
                <Card data-testid="card-existing-referrals">
                  <CardHeader>
                    <CardTitle>Your Referrals</CardTitle>
                    <CardDescription>
                      Track the status of your referrals and earned credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {referralsData.referrals.map((referral: any, index: number) => (
                        <div 
                          key={referral.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`row-referral-${referral.id}`}
                        >
                          <div>
                            <p className="font-medium">{referral.referredName}</p>
                            <p className="text-sm text-gray-600">
                              Referred on {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={referral.status === 'converted' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${referral.id}`}
                          >
                            {referral.status === 'converted' ? 'Credit Earned' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Referral Form */}
              <Card data-testid="card-referral-form">
                <CardHeader>
                  <CardTitle>Step 2: Refer a Friend</CardTitle>
                  <CardDescription>
                    Enter your friend's information and we'll create a special offer just for them
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...referralForm}>
                    <form onSubmit={referralForm.handleSubmit(handleReferralSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={referralForm.control}
                          name="referredName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Friend's Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Jane Smith" 
                                  {...field} 
                                  data-testid="input-referred-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={referralForm.control}
                          name="referredPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Friend's Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel" 
                                  placeholder="617-555-5678" 
                                  {...field} 
                                  data-testid="input-referred-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={referralForm.control}
                        name="referredEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Friend's Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="jane@example.com" 
                                {...field} 
                                data-testid="input-referred-email"
                              />
                            </FormControl>
                            <FormDescription>
                              We'll send them details about their $99 discount
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={referralForm.control}
                          name="referredAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="123 Main St" 
                                  {...field} 
                                  data-testid="input-referred-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={referralForm.control}
                          name="referredCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Quincy" 
                                  {...field} 
                                  data-testid="input-referred-city"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={referralForm.control}
                          name="referredState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="MA" 
                                  {...field} 
                                  data-testid="input-referred-state"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={referralForm.control}
                          name="referredZip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="02169" 
                                  {...field} 
                                  data-testid="input-referred-zip"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={referralForm.control}
                        name="serviceNeeded"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Needed (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Drain cleaning, Water heater repair" 
                                {...field} 
                                data-testid="input-service-needed"
                              />
                            </FormControl>
                            <FormDescription>
                              Help us understand what service your friend needs
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={referralForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional information that might be helpful..."
                                className="min-h-[100px]"
                                {...field} 
                                data-testid="textarea-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={createReferralMutation.isPending}
                        className="w-full md:w-auto"
                        data-testid="button-submit-referral"
                      >
                        {createReferralMutation.isPending ? "Submitting..." : "Submit Referral"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Change Account Button */}
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentCustomer(null);
                    lookupForm.reset();
                  }}
                  data-testid="button-change-account"
                >
                  Look Up Different Account
                </Button>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <Card className="mt-12 bg-gray-50" data-testid="card-terms">
            <CardHeader>
              <CardTitle className="text-lg">Program Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Referred customers must be new to Johnson Bros. Plumbing</li>
                <li>• $99 discount applies to first service only (minimum service of $200)</li>
                <li>• $50 credit is issued after referred customer completes their first paid service</li>
                <li>• Credits can be applied to future services and do not expire</li>
                <li>• Program terms subject to change without notice</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
}