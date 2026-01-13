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
import { startSmsVerification, confirmSmsVerification } from "@/lib/smsVerification";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, X, User, UserPlus, Clock, DollarSign, ChevronLeft, ChevronRight, 
  ClipboardList, Gift, Info, Upload, Image as ImageIcon, AlertTriangle,
  Droplets, Flame, Wrench, Settings, Home, Camera, Trash2, CheckCircle,
  AlertCircle, MapPin, FileText, Lock, Shield, Phone, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { formatTimeSlotWindow, isWeekendDate } from "@/lib/timeUtils";
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
  bookingFor: {
    isForSomeoneElse: boolean;
    recipient: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  recurring: {
    frequency: "one_time" | "monthly" | "quarterly" | "biannual" | "annual";
    notes: string;
  };
  smsVerification: {
    status: "unverified" | "pending" | "verified";
    phone: string;
    verifiedAt?: string;
  };
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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
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
    bookingFor: {
      isForSomeoneElse: false,
      recipient: {
        name: "",
        phone: "",
        relationship: "",
      },
    },
    recurring: {
      frequency: "one_time",
      notes: "",
    },
    smsVerification: {
      status: "unverified",
      phone: "",
    },
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [smsCode, setSmsCode] = useState("");
  const [smsError, setSmsError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const steps = [
    { id: 1, name: "Schedule", icon: Calendar },
    { id: 2, name: "Info", icon: User },
    { id: 3, name: "Confirm", icon: CheckCircle },
  ];

  // Auto-select the $99 Service Call on mount
  useEffect(() => {
    if (isOpen && !bookingData.selectedService) {
      // Default $99 service call
      const defaultService = {
        id: 'service-call',
        name: 'Service Call',
        description: 'Our professional plumber will assess your situation and provide expert solutions.',
        price: 99,
        category: 'maintenance'
      };
      setBookingData(prev => ({ ...prev, selectedService: defaultService }));
    }
  }, [isOpen, bookingData.selectedService]);

  // Simplified optional problem description (no complex form validation)
  const [problemDescription, setProblemDescription] = useState("");

  // Forms
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
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const smsPhone = customerType === "returning"
    ? returningCustomerForm.watch("phone")
    : newCustomerForm.watch("phone");

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

      // Check for express booking
      const bookingType = sessionStorage.getItem('booking_type') || localStorage.getItem('booking_type');
      if (bookingType === 'express') {
        setIsExpressBooking(true);
        const expressFeeWaived = sessionStorage.getItem('express_fee_waived') === 'true' || 
                                localStorage.getItem('express_fee_waived') === 'true';
        setIsFeeWaived(expressFeeWaived);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (smsPhone && bookingData.smsVerification.phone && smsPhone !== bookingData.smsVerification.phone) {
      setBookingData(prev => ({
        ...prev,
        smsVerification: {
          status: "unverified",
          phone: smsPhone,
        }
      }));
      setSmsCode("");
      setSmsError(null);
    }
  }, [smsPhone, bookingData.smsVerification.phone]);

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
          addOnsTotal: 0,
          total: basePrice + additionalFees,
        },
      }));
    }
  }, [bookingData.selectedService, bookingData.selectedTimeSlot, bookingData.selectedDate, isFeeWaived]);

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
        setCurrentStep(3); // Move to confirmation
      }
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
      if (errorData?.customer) {
        setBookingData(prev => ({ ...prev, customer: errorData.customer }));
        setCurrentStep(3);
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
        setCurrentStep(3);
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

  const startSmsVerificationMutation = useMutation({
    mutationFn: startSmsVerification,
    onSuccess: (data: any) => {
      setBookingData(prev => ({
        ...prev,
        smsVerification: {
          status: "pending",
          phone: data.phone || smsPhone || "",
        }
      }));
      setSmsError(null);
      toast({
        title: "Verification sent",
        description: "Check your phone for the 6-digit code."
      });
    },
    onError: (error: any) => {
      setSmsError(error?.response?.data?.error || "Unable to send verification code.");
      toast({
        title: "Verification failed",
        description: error?.response?.data?.error || "Unable to send verification code.",
        variant: "destructive",
      });
    }
  });

  const confirmSmsVerificationMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => confirmSmsVerification(phone, code),
    onSuccess: (data: any) => {
      setBookingData(prev => ({
        ...prev,
        smsVerification: {
          status: "verified",
          phone: data.phone || smsPhone || "",
          verifiedAt: data.verified_at,
        }
      }));
      setSmsError(null);
      toast({
        title: "Phone verified",
        description: "Thanks! Your number is verified."
      });
    },
    onError: (error: any) => {
      setSmsError(error?.response?.data?.error || "Verification failed.");
      toast({
        title: "Verification failed",
        description: error?.response?.data?.error || "Verification failed.",
        variant: "destructive",
      });
    }
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
      bookingFor: {
        isForSomeoneElse: false,
        recipient: {
          name: "",
          phone: "",
          relationship: "",
        },
      },
      recurring: {
        frequency: "one_time",
        notes: "",
      },
      smsVerification: {
        status: "unverified",
        phone: "",
      },
      estimatedPrice: {
        base: 0,
        additionalFees: 0,
        addOnsTotal: 0,
        total: 0,
      },
    });
    setCustomerType(null);
    setIsExpressBooking(false);
    setIsFeeWaived(false);
    setProblemDescription("");
    setSmsCode("");
    setSmsError(null);
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

    if (bookingData.bookingFor.isForSomeoneElse) {
      const recipient = bookingData.bookingFor.recipient;
      if (!recipient.name || !recipient.phone) {
        toast({
          title: "Recipient details needed",
          description: "Please provide the recipient's name and phone number.",
          variant: "destructive",
        });
        return;
      }
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
      problemDetails: {
        description: problemDescription || "Customer will discuss issue with plumber",
        severity: "moderate",
        commonIssues: [],
        duration: "unknown"
      },
      photos: bookingData.photos.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        mimeType: photo.mimeType,
        base64: photo.base64,
        size: photo.size,
      })),
      selectedDate: bookingData.selectedDate,
      selectedTime: new Date(bookingData.selectedTimeSlot.startTime).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      problemDescription: bookingData.problemDetails.description,
      bookingFor: bookingData.bookingFor,
      recurring: bookingData.recurring,
      smsVerification: bookingData.smsVerification,
      estimatedPrice: bookingData.estimatedPrice,
      isExpressBooking,
      isFeeWaived,
    };

    createBookingMutation.mutate(bookingPayload);
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-center mb-6 pt-2">
          <img 
            src="/JB_logo_New_1756136293648.png" 
            alt="Johnson Bros. Plumbing & Drain Cleaning" 
            className="h-16 w-auto object-contain"
            data-testid="modal-logo"
          />
        </div>
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

  const generateWeekDays = () => {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const todayDate = estTime.toISOString().split('T')[0];
    
    // Find the Saturday that starts this week (looking back from today)
    const currentDayOfWeek = estTime.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSaturday = currentDayOfWeek === 6 ? 0 : currentDayOfWeek + 1;
    
    const weekStart = new Date(estTime);
    weekStart.setDate(estTime.getDate() - daysToSaturday + (weekOffset * 7));
    
    const weekdays = [];
    const saturday = {
      date: new Date(weekStart).toISOString().split('T')[0],
      dayNum: weekStart.getDate(),
      dayName: 'Sat',
      isWeekend: true,
      isPast: new Date(weekStart).toISOString().split('T')[0] < todayDate,
      isToday: new Date(weekStart).toISOString().split('T')[0] === todayDate,
    };
    
    // Mon-Fri (5 weekdays)
    for (let i = 2; i <= 6; i++) { // Monday is +2 from Saturday
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const tomorrow = new Date(estTime);
      tomorrow.setDate(estTime.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      weekdays.push({
        date: dateStr,
        dayNum: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: false,
        isPast: dateStr < todayDate,
        isToday: dateStr === todayDate,
        isTomorrow: dateStr === tomorrowStr,
      });
    }
    
    const sundayDate = new Date(weekStart);
    sundayDate.setDate(weekStart.getDate() + 1);
    const sunday = {
      date: sundayDate.toISOString().split('T')[0],
      dayNum: sundayDate.getDate(),
      dayName: 'Sun',
      isWeekend: true,
      isPast: sundayDate.toISOString().split('T')[0] < todayDate,
      isToday: sundayDate.toISOString().split('T')[0] === todayDate,
    };
    
    return { weekdays };
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
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">Live availability</Badge>
              <span>Real-time openings synced with our dispatch schedule.</span>
            </div>
          </DialogHeader>
        )}

        {renderStepIndicator()}

        {/* Step 1: Date & Time Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Select Date & Time</h3>

            {/* Emergency Services Card - Conditional Visibility */}
            {(() => {
              const now = new Date();
              const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
              const day = estTime.getDay(); // 0 = Sun, 6 = Sat
              const hour = estTime.getHours();
              const isWeekend = day === 0 || day === 6;
              const isAfterHours = hour >= 17 || hour < 6;

              if (isWeekend || isAfterHours) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-red-600" />
                      <h4 className="font-bold text-red-900 text-xs uppercase tracking-wider">Emergency Service Available</h4>
                    </div>
                    <div className="text-[11px] text-red-800 leading-tight mb-3">
                      Saturdays, Sundays, and After-Hours services are phone-only.
                    </div>
                    <a 
                      href="tel:6174799911" 
                      className="flex items-center justify-between bg-white border border-red-400 rounded-md p-2 group hover:bg-red-50 transition-all active:scale-[0.98]"
                    >
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-red-500">Call Now</span>
                        <span className="text-sm font-black text-red-600">(617) 479-9911</span>
                      </div>
                      <Phone className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                    </a>
                  </div>
                );
              }
              return null;
            })()}

            {/* Date Selection - Weekly Calendar View */}
            <div className="space-y-4">
              {/* Week Selection Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setWeekOffset(0)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    weekOffset === 0 
                      ? 'bg-white text-johnson-blue shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  This Week
                </button>
                <button
                  onClick={() => setWeekOffset(1)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    weekOffset === 1 
                      ? 'bg-white text-johnson-blue shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  Next Week
                </button>
              </div>

              {/* Weekly Calendar Layout */}
              {(() => {
                const { weekdays } = generateWeekDays();
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-stretch gap-2">
                      {/* Weekdays Grid (Mon-Fri) */}
                      <div className="flex-1 grid grid-cols-5 gap-2">
                        {weekdays.map((day) => {
                          const isSelected = bookingData.selectedDate === day.date;
                          const isDisabled = day.isPast;
                          
                          if (isDisabled) {
                            return (
                              <div
                                key={day.date}
                                className="p-3 rounded-lg text-center min-h-[90px] flex flex-col justify-center items-center gap-1 bg-gray-100/50 border border-gray-100"
                              >
                                <div className="text-xs font-medium text-gray-400">
                                  {day.dayName}
                                </div>
                                <div className="text-xl font-bold text-gray-300">
                                  {day.dayNum}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={day.date}
                              onClick={() => setBookingData(prev => ({ 
                                ...prev, 
                                selectedDate: day.date, 
                                selectedTimeSlot: null 
                              }))}
                              className={`p-3 rounded-lg text-center transition-all min-h-[90px] flex flex-col justify-center items-center gap-1 ${
                                isSelected
                                  ? 'bg-johnson-blue text-white shadow-md'
                                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              <div className="text-xs font-medium opacity-75">
                                {day.dayName}
                              </div>
                              <div className="text-xl font-bold">
                                {day.dayNum}
                              </div>
                              <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                              }`}>
                                Open
                              </div>
                              {day.isToday && !isDisabled && (
                                <Badge className={`text-[8px] px-1 py-0 h-3 leading-none ${isSelected ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                                  Today
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Time Slot Selection */}
            {bookingData.selectedDate && (() => {
              const now = new Date();
              const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
              const currentHour = estTime.getHours();
              const todayDate = estTime.toISOString().split('T')[0];
              const isTodaySelected = bookingData.selectedDate === todayDate;
              const isPastNoon = currentHour >= 12;
              const isSameDayCutoff = isTodaySelected && isPastNoon;
              
              if (isSameDayCutoff) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <Phone className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-bold text-base text-amber-700 mb-1">Call for Same-Day Availability</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Online same-day booking closes at 12 PM. Please call us directly to check today's availability.
                    </p>
                    <a 
                      href="tel:6174799911"
                      className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition-all shadow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Call (617) 479-9911
                    </a>
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                      Or select tomorrow for online booking
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-johnson-blue" />
                    Choose Your Time Window
                  </Label>
                  {timeSlotsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-pulse flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Loading times...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {timeSlots?.map((slot: AvailableTimeSlot, index: number) => {
                        const isSelected = bookingData.selectedTimeSlot?.id === slot.id;
                        const timeLabels = ['Morning', 'Midday', 'Afternoon'];
                        const timeIcons = ['🌅', '☀️', '🌆'];
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setBookingData(prev => ({ ...prev, selectedTimeSlot: slot }))}
                            disabled={!slot.isAvailable}
                            className={`relative p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
                              isSelected
                                ? 'bg-johnson-blue text-white shadow-lg ring-2 ring-johnson-blue ring-offset-2'
                                : slot.isAvailable
                                  ? 'bg-white border-2 border-gray-200 hover:border-johnson-blue hover:shadow-md'
                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{timeIcons[index] || '⏰'}</span>
                                <div>
                                  <div className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                    {timeLabels[index] || 'Window'}
                                  </div>
                                  <div className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                    {formatTimeSlotWindow(slot.startTime, slot.endTime)}
                                  </div>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-white border-white' 
                                  : slot.isAvailable 
                                    ? 'border-gray-300' 
                                    : 'border-gray-200'
                              }`}>
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-johnson-blue" />
                                )}
                              </div>
                            </div>
                            {slot.isAvailable && !isSelected && (
                              <div className="absolute top-2 left-2">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">
                                  Available
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Optional Problem Description */}
            {!(bookingData.selectedDate === new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).toISOString().split('T')[0] && 
              new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).getHours() >= 12) && (
              <div className="space-y-2 mt-4">
                <Label>Problem Description (Optional)</Label>
                <Textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Briefly describe your plumbing issue..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Help us prepare for your service by providing details about your plumbing issue.
                </p>
              </div>
            )}

            <div className="space-y-3 mt-4">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-johnson-blue" />
                Add photos (optional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
              />
              <p className="text-xs text-gray-500">
                Upload up to 5 photos (max 5MB each) to help our team prepare.
              </p>
              {bookingData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {bookingData.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.preview}
                        alt={photo.filename}
                        className="h-20 w-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 rounded-full bg-white/80 p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${photo.filename}`}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Fee Info */}
            {!(bookingData.selectedDate === new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).toISOString().split('T')[0] && 
              new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).getHours() >= 12) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-johnson-blue mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-johnson-blue">$99 Service Call Fee</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Our professional plumber will assess your situation and provide expert solutions. Service call fee may be waived based on current capacity.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!bookingData.selectedTimeSlot}
                className="bg-johnson-blue hover:bg-johnson-teal"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Customer Information */}
        {currentStep === 2 && (
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

                    <div className="border border-blue-100 bg-blue-50/60 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Verify phone by SMS</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!smsPhone || smsPhone.length < 10 || startSmsVerificationMutation.isPending || bookingData.smsVerification.status === "verified"}
                          onClick={() => {
                            if (!smsPhone || smsPhone.length < 10) {
                              toast({
                                title: "Phone number required",
                                description: "Enter a valid phone number to receive a verification code.",
                                variant: "destructive",
                              });
                              return;
                            }
                            startSmsVerificationMutation.mutate(smsPhone);
                          }}
                        >
                          {bookingData.smsVerification.status === "verified"
                            ? "Verified"
                            : startSmsVerificationMutation.isPending
                            ? "Sending..."
                            : "Send Code"}
                        </Button>
                      </div>

                      {bookingData.smsVerification.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="h-9"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={smsCode.trim().length < 4 || confirmSmsVerificationMutation.isPending}
                            onClick={() => {
                              if (!smsPhone) return;
                              confirmSmsVerificationMutation.mutate({ phone: smsPhone, code: smsCode.trim() });
                            }}
                          >
                            {confirmSmsVerificationMutation.isPending ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                      )}

                      {bookingData.smsVerification.status === "verified" && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Phone verified
                        </div>
                      )}

                      {smsError && (
                        <p className="text-xs text-red-600">{smsError}</p>
                      )}
                    </div>

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
                        onClick={() => setCurrentStep(1)}
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
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={returningCustomerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={returningCustomerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Smith" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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

                    <div className="border border-blue-100 bg-blue-50/60 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Verify phone by SMS</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!smsPhone || smsPhone.length < 10 || startSmsVerificationMutation.isPending || bookingData.smsVerification.status === "verified"}
                          onClick={() => {
                            if (!smsPhone || smsPhone.length < 10) {
                              toast({
                                title: "Phone number required",
                                description: "Enter a valid phone number to receive a verification code.",
                                variant: "destructive",
                              });
                              return;
                            }
                            startSmsVerificationMutation.mutate(smsPhone);
                          }}
                        >
                          {bookingData.smsVerification.status === "verified"
                            ? "Verified"
                            : startSmsVerificationMutation.isPending
                            ? "Sending..."
                            : "Send Code"}
                        </Button>
                      </div>

                      {bookingData.smsVerification.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="h-9"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={smsCode.trim().length < 4 || confirmSmsVerificationMutation.isPending}
                            onClick={() => {
                              if (!smsPhone) return;
                              confirmSmsVerificationMutation.mutate({ phone: smsPhone, code: smsCode.trim() });
                            }}
                          >
                            {confirmSmsVerificationMutation.isPending ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                      )}

                      {bookingData.smsVerification.status === "verified" && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Phone verified
                        </div>
                      )}

                      {smsError && (
                        <p className="text-xs text-red-600">{smsError}</p>
                      )}
                    </div>

                    <div className="flex justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
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

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="booking-for-someone-else"
                  checked={bookingData.bookingFor.isForSomeoneElse}
                  onCheckedChange={(checked) => setBookingData(prev => ({
                    ...prev,
                    bookingFor: {
                      ...prev.bookingFor,
                      isForSomeoneElse: Boolean(checked)
                    }
                  }))}
                />
                <Label htmlFor="booking-for-someone-else">Booking for someone else</Label>
              </div>

              {bookingData.bookingFor.isForSomeoneElse && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Recipient Name</Label>
                    <Input
                      value={bookingData.bookingFor.recipient.name}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        bookingFor: {
                          ...prev.bookingFor,
                          recipient: {
                            ...prev.bookingFor.recipient,
                            name: e.target.value
                          }
                        }
                      }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Recipient Phone</Label>
                    <Input
                      type="tel"
                      value={bookingData.bookingFor.recipient.phone}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        bookingFor: {
                          ...prev.bookingFor,
                          recipient: {
                            ...prev.bookingFor.recipient,
                            phone: e.target.value
                          }
                        }
                      }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Relationship (optional)</Label>
                    <Input
                      value={bookingData.bookingFor.recipient.relationship}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        bookingFor: {
                          ...prev.bookingFor,
                          recipient: {
                            ...prev.bookingFor.recipient,
                            relationship: e.target.value
                          }
                        }
                      }))}
                      placeholder="Property manager, family member, tenant, etc."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && bookingData.customer && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Your Booking</h3>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Service:</span>
                <span>{bookingData.selectedService?.name} - $99</span>
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
                      {formatTimeSlotWindow(bookingData.selectedTimeSlot.startTime, bookingData.selectedTimeSlot.endTime)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Customer:</span>
                <span>{bookingData.customer.firstName} {bookingData.customer.lastName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Phone:</span>
                <span>{bookingData.customer.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Address:</span>
                <span className="text-right">{bookingData.customer.address}</span>
              </div>

              {bookingData.bookingFor.isForSomeoneElse && (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Booking For:</span>
                  <span className="text-sm text-gray-600">
                    {bookingData.bookingFor.recipient.name || "Recipient"} {bookingData.bookingFor.recipient.relationship ? `(${bookingData.bookingFor.recipient.relationship})` : ""}
                  </span>
                </div>
              )}

              {bookingData.smsVerification.status === "verified" && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Phone verified via SMS
                </div>
              )}

              {bookingData.photos.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Photos:</span>
                  <span>{bookingData.photos.length} attached</span>
                </div>
              )}

              {problemDescription && (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Problem Description:</span>
                  <span className="text-sm text-gray-600">{problemDescription}</span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Service Call Fee:</span>
                  <span className="text-johnson-blue">$99</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isFeeWaived ? "Fee may be waived based on current capacity" : "Additional costs will be quoted on-site"}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <Info className="inline w-4 h-4 mr-1" />
                Final price for repairs will be quoted by the plumber after assessment.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={createBookingMutation.isPending}
                className="bg-johnson-blue hover:bg-johnson-teal"
                data-testid="button-confirm-booking"
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
