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
import heroImage from "@assets/stock_images/happy_friends_celebr_4fbee77b.jpg";

// Customer lookup schema
const customerLookupSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Referral form schema
const referralFormSchema = z.object({
  referredFirstName: z.string().min(1, "First name is required"),
  referredLastName: z.string().min(1, "Last name is required"),
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
      phone: "",
      firstName: "",
      lastName: "",
    },
  });

  // Referral form
  const referralForm = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      referredFirstName: "",
      referredLastName: "",
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
      const response = await apiRequest("POST", "/api/customers/lookup", {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      });
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
        setLookupError("Customer not found. Please verify that all three fields (first name, last name, and phone number) match exactly as they appear in our records.");
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
      
      const referrerPhone = currentCustomer.phone || currentCustomer.mobile_number || currentCustomer.home_number;
      if (!referrerPhone) {
        throw new Error("No phone number found for your account. Please contact support.");
      }
      
      const firstName = currentCustomer.firstName || currentCustomer.first_name;
      const lastName = currentCustomer.lastName || currentCustomer.last_name;
      
      const response = await apiRequest("POST", "/api/referrals", {
        referrerCustomerId: currentCustomer.id,
        referrerName: `${firstName} ${lastName}`,
        referrerPhone: referrerPhone,
        ...data,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Referral Submitted!",
        description: "Thank you for referring a friend! You'll both receive $50 credit toward any service when they complete their booking.",
      });
      referralForm.reset();
      // Invalidate any referral queries
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to submit referral. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
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
  
  // Reset to customer lookup
  const handleResetLookup = () => {
    setCurrentCustomer(null);
    setLookupError(null);
    lookupForm.reset();
  };

  return (
    <>
      <SEO
        title="Referral Program | Johnson Bros. Plumbing & Drain Cleaning"
        description="Refer friends and family to Johnson Bros. Plumbing and earn rewards! Both you and your friend get $50 credit toward any service."
        keywords={["referral program", "plumbing referral", "earn rewards", "discount plumbing", "Quincy MA"]}
        url="/referral"
        type="website"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />
        
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Hero Section with Background */}
          <div className="mb-12 relative">
            <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-r from-blue-600/10 to-green-600/10 rounded-3xl p-8 md:p-12">
              <div className="text-center md:text-left">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  Refer Friends, You Both Win!
                </h1>
                <p className="text-2xl text-gray-700 font-medium mb-4">
                  Share the exceptional service you've experienced with Johnson Bros. Plumbing.
                </p>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 inline-block">
                  <p className="text-3xl text-blue-700 font-bold">
                    $50 + $50 = Win-Win! 🎉
                  </p>
                  <p className="text-lg text-gray-600 mt-2">
                    You both get credit toward any service!
                  </p>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="Friends celebrating together" 
                  className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                />
                <div className="absolute -bottom-4 -right-4 bg-green-500 text-white rounded-full p-4 shadow-lg">
                  <DollarSign className="h-12 w-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card data-testid="card-benefit-friend" className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Gift className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold">Your Friend Gets $50</h3>
                </div>
                <p className="text-gray-600">
                  Your referred friend receives $50 credit toward any plumbing service we provide.
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-benefit-credit" className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-semibold">You Get $50 Too!</h3>
                </div>
                <p className="text-gray-600">
                  Receive $50 credit toward any service when your referral completes their booking.
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-benefit-unlimited" className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <h3 className="text-lg font-semibold">Unlimited Referrals</h3>
                </div>
                <p className="text-gray-600">
                  No limits on referrals - the more friends you refer, the more you both earn!
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
                  Enter your information exactly as it appears in our records. All three fields must match to access your referral dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...lookupForm}>
                  <form onSubmit={lookupForm.handleSubmit(handleCustomerLookup)} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={lookupForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
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
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} data-testid="input-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={lookupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="617-555-1234" 
                                {...field} 
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Alert>
                      <AlertDescription>
                        For security, all three fields must match your customer profile exactly. Please use the same phone number you provided during service.
                      </AlertDescription>
                    </Alert>

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
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200" data-testid="alert-customer-info">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
                      </div>
                      <div className="space-y-1 text-gray-700">
                        <p className="text-lg font-medium">
                          {currentCustomer.firstName || currentCustomer.first_name} {currentCustomer.lastName || currentCustomer.last_name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Phone:</span> {currentCustomer.phone || currentCustomer.mobile_number || currentCustomer.home_number}
                        </p>
                        {(currentCustomer.address || currentCustomer.street) && (
                          <p className="text-sm">
                            <span className="font-medium">Address:</span> {currentCustomer.address || currentCustomer.street}
                            {(currentCustomer.city || currentCustomer.zip) && (
                              <>, {currentCustomer.city || ''} {currentCustomer.state || ''} {currentCustomer.zip || ''}</>
                            )}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-3">
                        You can now refer friends and track your referral rewards.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetLookup}
                      className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                      data-testid="button-not-you"
                    >
                      Not you? Click here...
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Referrals */}
              {referralsData?.referrals && referralsData.referrals.length > 0 && (
                <Card data-testid="card-existing-referrals">
                  <CardHeader>
                    <CardTitle>Your Referrals</CardTitle>
                    <CardDescription>
                      Track the status of your referrals and earned credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {referralsData?.referrals?.map((referral: any, index: number) => (
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
                          name="referredFirstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Friend's First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Jane" 
                                  {...field} 
                                  data-testid="input-referred-firstname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={referralForm.control}
                          name="referredLastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Friend's Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Smith" 
                                  {...field} 
                                  data-testid="input-referred-lastname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                              We'll send them details about their $50 credit
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
          <Card className="mt-12 bg-gradient-to-br from-gray-50 to-blue-50 border-blue-200" data-testid="card-terms">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Program Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Referred customers must be new to Johnson Bros. Plumbing & Drain Cleaning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Both parties receive $50 credit</strong> after the referred customer completes their first paid service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Credits can be applied toward <strong>any and all services</strong> we provide (no minimum purchase required)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Credits never expire and can be combined with other offers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Unlimited referrals - refer as many friends as you'd like!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Program terms subject to change; current customers will be notified of any changes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
}