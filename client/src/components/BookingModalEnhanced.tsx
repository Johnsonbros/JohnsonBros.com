import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, MobileDialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog-mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipe } from "@/hooks/use-swipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { getTimeSlots, createBooking, getServices } from "@/lib/housecallApi";
import { createCustomer, lookupCustomer } from "@/lib/customerApi";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, X, User, UserPlus, Clock, DollarSign, ChevronLeft, ChevronRight, 
  ClipboardList, Gift, Info, Upload, Image as ImageIcon, AlertTriangle,
  Droplets, Flame, Wrench, Settings, Home, Camera, Trash2, CheckCircle,
  AlertCircle, MapPin, FileText, Lock, Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { formatTimeWindowEST } from "@/lib/timeUtils";
import { PricingEstimate } from "./PricingEstimate";

// Types
interface AvailableTimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface PhotoUpload {
  id: string;
  filename: string;
  mimeType: string;
  base64: string;
  preview: string;
  size: number;
}

interface UpsellOffer {
  id: number;
  triggerService: string;
  upsellService: string;
  bundlePrice?: number;
  savingsAmount?: number;
  title: string;
  description: string;
  isActive: boolean;
}

interface BookingData {
  selectedService: any;
  selectedAddOns: UpsellOffer[];
  problemDetails: {
    description: string;
    commonIssues: string[];
    severity: string;
    duration: string;
  };
  photos: PhotoUpload[];
  selectedDate: string;
  selectedTimeSlot: AvailableTimeSlot | null;
  customer: Customer | null;
  estimatedPrice: {
    base: number;
    additionalFees: number;
    addOnsTotal: number;
    total: number;
  };
}

// Common issues by service type
const commonIssuesByService: Record<string, string[]> = {
  "emergency-repair": [
    "Burst pipe",
    "Major leak",
    "No water",
    "Sewage backup",
    "Water heater failure",
    "Flooding"
  ],
  "drain-cleaning": [
    "Slow draining sink",
    "Clogged toilet",
    "Multiple drain backups",
    "Bad odors from drains",
    "Standing water",
    "Gurgling sounds"
  ],
  "water-heater": [
    "No hot water",
    "Insufficient hot water",
    "Water too hot/cold",
    "Leaking water heater",
    "Strange noises",
    "Rusty water"
  ],
  "pipe-repair": [
    "Visible leak",
    "Low water pressure",
    "Frozen pipes",
    "Pipe corrosion",
    "Water discoloration",
    "Banging pipes"
  ],
  "fixtures": [
    "Leaky faucet",
    "Running toilet",
    "Broken fixture",
    "Installation needed",
    "Replacement needed",
    "Poor water flow"
  ],
  "remodeling": [
    "Bathroom renovation",
    "Kitchen plumbing",
    "Adding fixtures",
    "Moving plumbing lines",
    "Updating old plumbing",
    "Full system upgrade"
  ]
};

// Service icons mapping
const serviceIcons: Record<string, any> = {
  emergency: AlertTriangle,
  maintenance: Droplets,
  installation: Flame,
  repair: Settings,
  renovation: Home,
  default: Wrench,
};

// Form Schemas
const problemDetailsSchema = z.object({
  description: z.string().min(10, "Please describe your plumbing issue (at least 10 characters)"),
  commonIssues: z.array(z.string()).optional(),
  severity: z.string().min(1, "Please select severity level"),
  duration: z.string().min(1, "Please indicate how long this has been an issue"),
});

const newCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Service address is required"),
});

const returningCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type ProblemDetailsFormValues = z.infer<typeof problemDetailsSchema>;
type NewCustomerFormValues = z.infer<typeof newCustomerSchema>;
type ReturningCustomerFormValues = z.infer<typeof returningCustomerSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedService?: string | null;
}

export default function BookingModalEnhanced({ isOpen, onClose, preSelectedService }: BookingModalProps) {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedService: null,
    selectedAddOns: [],
    problemDetails: {
      description: "",
      commonIssues: [],
      severity: "",
      duration: "",
    },
    photos: [],
    selectedDate: "",
    selectedTimeSlot: null,
    customer: null,
    estimatedPrice: {
      base: 0,
      additionalFees: 0,
      addOnsTotal: 0,
      total: 0,
    },
  });
  const [customerType, setCustomerType] = useState<"new" | "returning" | null>(null);
  const [isExpressBooking, setIsExpressBooking] = useState(false);
  const [isFeeWaived, setIsFeeWaived] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const steps = [
    { id: 1, name: "Service", icon: Wrench },
    { id: 2, name: "Problem", icon: ClipboardList },
    { id: 3, name: "Photos", icon: Camera },
    { id: 4, name: "Schedule", icon: Calendar },
    { id: 5, name: "Pricing", icon: DollarSign },
    { id: 6, name: "Info", icon: User },
    { id: 7, name: "Confirm", icon: CheckCircle },
  ];

  // Load services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/v1/services"],
    queryFn: getServices,
  });

  // Load upsell offers based on selected service
  const { data: upsellOffers, isLoading: upsellLoading } = useQuery<UpsellOffer[]>({
    queryKey: ["/api/v1/upsell-offers", bookingData.selectedService?.id],
    queryFn: async () => {
      if (!bookingData.selectedService?.id) return [];
      const response = await fetch(`/api/v1/upsell-offers/${bookingData.selectedService.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!bookingData.selectedService?.id,
  });

  // Forms
  const problemForm = useForm<ProblemDetailsFormValues>({
    resolver: zodResolver(problemDetailsSchema),
    defaultValues: {
      description: "",
      commonIssues: [],
      severity: "",
      duration: "",
    },
  });

  const newCustomerForm = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const returningCustomerForm = useForm<ReturningCustomerFormValues>({
    resolver: zodResolver(returningCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // Load time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ["/api/v1/timeslots", bookingData.selectedDate],
    queryFn: () => getTimeSlots(bookingData.selectedDate),
    enabled: !!bookingData.selectedDate,
  });

  // Save progress to session storage
  useEffect(() => {
    if (isOpen && bookingData) {
      sessionStorage.setItem('bookingProgress', JSON.stringify({
        ...bookingData,
        photos: bookingData.photos.map(p => ({ ...p, base64: '', preview: '' })), // Don't store base64
      }));
    }
  }, [bookingData, isOpen]);

  // Load progress from session storage
  useEffect(() => {
    if (isOpen) {
      const savedProgress = sessionStorage.getItem('bookingProgress');
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setBookingData(prev => ({
            ...prev,
            ...parsed,
            photos: [], // Don't restore photos from session
          }));
        } catch (e) {
          console.error('Failed to load booking progress', e);
        }
      }

      // Handle pre-selected service
      if (preSelectedService && services) {
        const service = services.find((s: any) => s.id === preSelectedService);
        if (service) {
          setBookingData(prev => ({ ...prev, selectedService: service }));
        }
      }

      // Check for express booking
      const bookingType = sessionStorage.getItem('booking_type') || localStorage.getItem('booking_type');
      if (bookingType === 'express') {
        setIsExpressBooking(true);
        const expressFeeWaived = sessionStorage.getItem('express_fee_waived') === 'true' || 
                                localStorage.getItem('express_fee_waived') === 'true';
        setIsFeeWaived(expressFeeWaived);
      }
    }
  }, [isOpen, preSelectedService, services]);

  // Calculate pricing
  useEffect(() => {
    if (bookingData.selectedService && bookingData.selectedTimeSlot) {
      const basePrice = bookingData.selectedService.price || 150;
      let additionalFees = 0;
      let addOnsTotal = 0;

      // Calculate add-ons pricing
      bookingData.selectedAddOns.forEach(addOn => {
        if (addOn.bundlePrice) {
          addOnsTotal += addOn.bundlePrice;
        }
      });

      // Emergency fee
      if (bookingData.problemDetails.severity === 'emergency') {
        additionalFees += 100;
      }

      // Same-day fee
      const selectedDate = new Date(bookingData.selectedDate);
      const today = new Date();
      if (selectedDate.toDateString() === today.toDateString()) {
        additionalFees += 50;
      }

      // After-hours fee
      if (bookingData.selectedTimeSlot) {
        const startTime = new Date(bookingData.selectedTimeSlot.startTime);
        const hour = startTime.getHours();
        if (hour < 8 || hour >= 18) {
          additionalFees += 75;
        }
      }

      // Fee waiver
      if (isFeeWaived) {
        additionalFees = Math.max(0, additionalFees - 99);
      }

      setBookingData(prev => ({
        ...prev,
        estimatedPrice: {
          base: basePrice,
          additionalFees,
          total: basePrice + additionalFees,
        },
      }));
    }
  }, [bookingData.selectedService, bookingData.selectedTimeSlot, bookingData.problemDetails.severity, bookingData.selectedDate, isFeeWaived]);

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoUpload[] = [];
    
    for (let i = 0; i < files.length && bookingData.photos.length + newPhotos.length < 5; i++) {
      const file = files[i];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        continue;
      }

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newPhotos.push({
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        mimeType: file.type,
        base64: base64.split(',')[1], // Remove data:image/...;base64, prefix
        preview: base64,
        size: file.size,
      });
    }

    setBookingData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }));

    // Reset input
    e.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    setBookingData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId),
    }));
  };

  // Create Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data: any) => {
      if (data.customer) {
        setBookingData(prev => ({ ...prev, customer: data.customer }));
        setCurrentStep(7); // Move to confirmation
      }
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
      if (errorData?.customer) {
        setBookingData(prev => ({ ...prev, customer: errorData.customer }));
        setCurrentStep(7);
        toast({
          title: "Account Found",
          description: "Using your existing account.",
        });
      } else {
        toast({
          title: "Error",
          description: errorData?.error || "Failed to create customer",
          variant: "destructive",
        });
      }
    },
  });

  // Lookup Customer Mutation
  const lookupCustomerMutation = useMutation({
    mutationFn: lookupCustomer,
    onSuccess: (data: any) => {
      if (data.customer) {
        setBookingData(prev => ({ ...prev, customer: data.customer }));
        setCurrentStep(7);
      }
    },
    onError: () => {
      toast({
        title: "Customer Not Found",
        description: "No customer found with that information. Please try again or create a new account.",
        variant: "destructive",
      });
    },
  });

  // Create Booking Mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your service appointment has been scheduled. You'll receive a confirmation email shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/appointments"] });
      sessionStorage.removeItem('bookingProgress');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error?.response?.data?.error || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCurrentStep(1);
    setBookingData({
      selectedService: null,
      problemDetails: {
        description: "",
        commonIssues: [],
        severity: "",
        duration: "",
      },
      photos: [],
      selectedDate: "",
      selectedTimeSlot: null,
      customer: null,
      estimatedPrice: {
        base: 0,
        additionalFees: 0,
        total: 0,
      },
    });
    setCustomerType(null);
    setIsExpressBooking(false);
    setIsFeeWaived(false);
    problemForm.reset();
    newCustomerForm.reset();
    returningCustomerForm.reset();
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.customer || !bookingData.selectedTimeSlot || !bookingData.selectedService) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    const bookingPayload: any = {
      customerInfo: {
        firstName: bookingData.customer.firstName,
        lastName: bookingData.customer.lastName,
        email: bookingData.customer.email,
        phone: bookingData.customer.phone,
        address: bookingData.customer.address,
        city: bookingData.customer.city || "Quincy",
        state: bookingData.customer.state || "MA",
        zipCode: bookingData.customer.zipCode || "02169"
      },
      selectedService: bookingData.selectedService,
      problemDetails: bookingData.problemDetails,
      photos: bookingData.photos.map(p => ({
        filename: p.filename,
        mimeType: p.mimeType,
        base64: p.base64,
      })),
      selectedDate: bookingData.selectedDate,
      selectedTime: new Date(bookingData.selectedTimeSlot.startTime).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      problemDescription: bookingData.problemDetails.description,
      estimatedPrice: bookingData.estimatedPrice,
      isExpressBooking,
      isFeeWaived,
    };

    createBookingMutation.mutate(bookingPayload);
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <Progress value={(currentStep / steps.length) * 100} className="h-2 mb-4" />
        <div className="flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  isActive ? 'text-johnson-blue' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                    isActive
                      ? 'bg-johnson-blue text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return days;
  };

  // Handle navigation between steps
  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Swipe gesture handlers for mobile
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNextStep,
    onSwipeRight: handlePreviousStep,
    threshold: 75
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <MobileDialogContent 
        className={`${isMobile ? '' : 'max-w-4xl max-h-[90vh] overflow-y-auto'}`}
        fullScreen={isMobile}
        title={isMobile ? steps.find(s => s.id === currentStep)?.name || "Book Service" : undefined}
        showBackButton={isMobile && currentStep > 1}
        onBack={handlePreviousStep}
        {...(isMobile ? swipeHandlers.handlers : {})}
      >
        {!isMobile && (
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-johnson-blue">
              Book Your Service
            </DialogTitle>
          </DialogHeader>
        )}

        {renderStepIndicator()}

        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select Your Service</h3>
            
            {servicesLoading ? (
              <div className="text-center py-8">Loading services...</div>
            ) : (
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'md:grid-cols-2 gap-4'}`}>
                {services?.map((service: any) => {
                  const IconComponent = serviceIcons[service.category as keyof typeof serviceIcons] || serviceIcons.default;
                  const isSelected = bookingData.selectedService?.id === service.id;
                  
                  return (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-johnson-blue bg-blue-50'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setBookingData(prev => ({ ...prev, selectedService: service }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            service.category === 'emergency' ? 'bg-red-100' :
                            service.category === 'maintenance' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{service.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <Badge variant="outline">${service.price || 150}+</Badge>
                              <span className="text-xs text-gray-500">45-90 min typical</span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-johnson-blue" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!bookingData.selectedService}
                className="bg-johnson-blue hover:bg-johnson-teal"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Upsell Section */}
            {bookingData.selectedService && upsellOffers && upsellOffers.length > 0 && (
              <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-johnson-orange" />
                  <h4 className="font-semibold text-lg">Frequently Added Together</h4>
                </div>
                
                <div className="space-y-3">
                  {upsellOffers.map((offer) => {
                    const isSelected = bookingData.selectedAddOns.some(a => a.id === offer.id);
                    return (
                      <div
                        key={offer.id}
                        className={`p-4 bg-white rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-johnson-orange bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => {
                          setBookingData(prev => ({
                            ...prev,
                            selectedAddOns: isSelected
                              ? prev.selectedAddOns.filter(a => a.id !== offer.id)
                              : [...prev.selectedAddOns, offer]
                          }));
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold">{offer.title}</h5>
                              {offer.savingsAmount && (
                                <Badge variant="secondary" className="bg-green-50 text-green-700">
                                  Save ${offer.savingsAmount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                            {offer.bundlePrice && (
                              <p className="text-sm font-semibold mt-2 text-johnson-orange">
                                Bundle price: ${offer.bundlePrice}
                              </p>
                            )}
                          </div>
                          <Checkbox
                            checked={isSelected}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {bookingData.selectedAddOns.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-green-800 font-semibold">
                        Total savings with bundles:
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        ${bookingData.selectedAddOns.reduce((sum, offer) => sum + (offer.savingsAmount || 0), 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Problem Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Describe Your Problem</h3>

            <Form {...problemForm}>
              <form onSubmit={problemForm.handleSubmit((data) => {
                setBookingData(prev => ({ ...prev, problemDetails: data as any }));
                setCurrentStep(3);
              })} className="space-y-4">
                
                {/* Common Issues Checklist */}
                {bookingData.selectedService && commonIssuesByService[bookingData.selectedService.id] && (
                  <FormField
                    control={problemForm.control}
                    name="commonIssues"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Common Issues (select all that apply)</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {commonIssuesByService[bookingData.selectedService.id].map((issue) => (
                            <div key={issue} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(issue)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, issue]);
                                  } else {
                                    field.onChange(current.filter((i: string) => i !== issue));
                                  }
                                }}
                              />
                              <label className="text-sm">{issue}</label>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Severity Selector */}
                <FormField
                  control={problemForm.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level</FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="minor" id="minor" />
                          <Label htmlFor="minor" className="flex items-center gap-2 cursor-pointer">
                            <Info className="w-4 h-4 text-blue-500" />
                            Minor (Inconvenient)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="moderate" id="moderate" />
                          <Label htmlFor="moderate" className="flex items-center gap-2 cursor-pointer">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            Moderate (Needs attention)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="urgent" id="urgent" />
                          <Label htmlFor="urgent" className="flex items-center gap-2 cursor-pointer">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Urgent (Causing problems)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="emergency" id="emergency" />
                          <Label htmlFor="emergency" className="flex items-center gap-2 cursor-pointer">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Emergency (Immediate help)
                          </Label>
                        </div>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration Selector */}
                <FormField
                  control={problemForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How long has this been an issue?</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="just_started">Just started</SelectItem>
                          <SelectItem value="few_days">A few days</SelectItem>
                          <SelectItem value="week">About a week</SelectItem>
                          <SelectItem value="few_weeks">A few weeks</SelectItem>
                          <SelectItem value="month">About a month</SelectItem>
                          <SelectItem value="months">Several months</SelectItem>
                          <SelectItem value="year_plus">A year or more</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Problem Description */}
                <FormField
                  control={problemForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please provide any additional details about your plumbing issue..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button type="submit" className="bg-johnson-blue hover:bg-johnson-teal">
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Step 3: Photo Upload */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Add Photos (Optional)</h3>
            <p className="text-sm text-gray-600">
              Upload photos to help us better understand the issue. You can add up to 5 photos.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={bookingData.photos.length >= 5}
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer inline-flex flex-col items-center ${
                  bookingData.photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Click to upload photos
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {bookingData.photos.length}/5 photos • Max 5MB each
                </span>
              </label>
            </div>

            {/* Photo Preview Grid */}
            {bookingData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {bookingData.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.preview}
                      alt={photo.filename}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                      {photo.filename}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-johnson-blue hover:bg-johnson-teal"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Date & Time Selection */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
            
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day) => {
                  const isSelected = bookingData.selectedDate === day.date;

                  return (
                    <button
                      key={day.date}
                      onClick={() => setBookingData(prev => ({ ...prev, selectedDate: day.date, selectedTimeSlot: null }))}
                      className={`p-2 rounded-lg text-center transition-all ${
                        isSelected
                          ? 'bg-johnson-blue text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xs font-medium">
                        {day.label}
                      </div>
                      {day.isToday && <Badge className="text-xs">Today</Badge>}
                      {day.isTomorrow && <Badge className="text-xs">Tomorrow</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            {bookingData.selectedDate && (
              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                {timeSlotsLoading ? (
                  <div className="text-center py-4">Loading available times...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots?.map((slot: AvailableTimeSlot) => {
                      const isSelected = bookingData.selectedTimeSlot?.id === slot.id;
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setBookingData(prev => ({ ...prev, selectedTimeSlot: slot }))}
                          disabled={!slot.isAvailable}
                          className={`p-3 rounded-lg text-sm transition-all ${
                            isSelected
                              ? 'bg-johnson-blue text-white'
                              : slot.isAvailable
                              ? 'bg-gray-100 hover:bg-gray-200'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeWindowEST(slot.startTime, slot.endTime)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                disabled={!bookingData.selectedTimeSlot}
                className="bg-johnson-blue hover:bg-johnson-teal"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Pricing Estimate */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Service Estimate</h3>
            
            {/* Trust Indicators for Pricing */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Our Price Guarantee</h4>
                  <p className="text-sm text-green-700 mt-1">
                    ✓ No hidden fees - price shown is final<br/>
                    ✓ Price match guarantee on comparable services<br/>
                    ✓ Upfront pricing approved before work begins
                  </p>
                </div>
              </div>
            </div>
            
            <PricingEstimate
              service={bookingData.selectedService}
              selectedDate={bookingData.selectedDate}
              selectedTimeSlot={bookingData.selectedTimeSlot}
              severity={bookingData.problemDetails.severity}
              isFeeWaived={isFeeWaived}
              onFeeWaiverChange={setIsFeeWaived}
            />

            <div className="flex justify-between gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(4)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(6)}
                className="bg-johnson-blue hover:bg-johnson-teal"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Customer Information */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Your Information</h3>

            {/* Security Badge */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-900 font-medium">Your information is secure and encrypted</span>
                <Badge variant="secondary" className="text-xs">256-bit SSL</Badge>
              </div>
            </div>

            <Tabs value={customerType || 'new'} onValueChange={(v) => setCustomerType(v as 'new' | 'returning')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">New Customer</TabsTrigger>
                <TabsTrigger value="returning">Returning Customer</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-4">
                <Form {...newCustomerForm}>
                  <form onSubmit={newCustomerForm.handleSubmit((data) => {
                    createCustomerMutation.mutate(data);
                  })} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={newCustomerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={newCustomerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={newCustomerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newCustomerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newCustomerForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main St, City, State ZIP" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(5)}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCustomerMutation.isPending}
                        className="bg-johnson-blue hover:bg-johnson-teal"
                      >
                        {createCustomerMutation.isPending ? "Creating..." : "Continue"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="returning" className="space-y-4">
                <Form {...returningCustomerForm}>
                  <form onSubmit={returningCustomerForm.handleSubmit((data) => {
                    lookupCustomerMutation.mutate(data);
                  })} className="space-y-4">
                    <FormField
                      control={returningCustomerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Doe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={returningCustomerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} placeholder="(555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(5)}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={lookupCustomerMutation.isPending}
                        className="bg-johnson-blue hover:bg-johnson-teal"
                      >
                        {lookupCustomerMutation.isPending ? "Looking up..." : "Continue"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 7: Confirmation */}
        {currentStep === 7 && bookingData.customer && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Your Booking</h3>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Service:</span>
                <span>{bookingData.selectedService?.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Severity:</span>
                <Badge variant={bookingData.problemDetails.severity === 'emergency' ? 'destructive' : 'secondary'}>
                  {bookingData.problemDetails.severity}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Date & Time:</span>
                <span>
                  {bookingData.selectedDate && new Date(bookingData.selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  {bookingData.selectedTimeSlot && (
                    <span className="ml-2 font-medium">
                      {formatTimeWindowEST(bookingData.selectedTimeSlot.startTime, bookingData.selectedTimeSlot.endTime)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Customer:</span>
                <span>{bookingData.customer.firstName} {bookingData.customer.lastName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Address:</span>
                <span className="text-right">{bookingData.customer.address}</span>
              </div>

              {bookingData.photos.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Photos:</span>
                  <span>{bookingData.photos.length} attached</span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Estimated Total:</span>
                  <span className="text-johnson-blue">${bookingData.estimatedPrice.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <Info className="inline w-4 h-4 mr-1" />
                Final price may vary based on the complexity of the work required.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(6)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={createBookingMutation.isPending}
                className="bg-johnson-blue hover:bg-johnson-teal"
              >
                {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                <CheckCircle className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </MobileDialogContent>
    </Dialog>
  );
}