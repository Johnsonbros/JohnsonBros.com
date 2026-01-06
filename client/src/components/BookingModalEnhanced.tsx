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
  AlertCircle, MapPin, FileText, Lock, Shield, Phone
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
  const [weekOffset, setWeekOffset] = useState(0);
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
      problemDetails: {
        description: problemDescription || "Customer will discuss issue with plumber",
        severity: "moderate",
        commonIssues: [],
        duration: "unknown"
      },
      photos: [],
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
          </DialogHeader>
        )}

        {renderStepIndicator()}

        {/* Step 1: Date & Time Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
            
            {/* Date Selection - Weekly Calendar View */}
            <div className="space-y-3">
              {/* Week Navigation Header */}
              <div className="flex items-center justify-between">
                <Label>SELECT DAY</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                    disabled={weekOffset === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[80px] text-center">
                    {weekOffset === 0 ? 'This Week' : 'Next Week'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset(prev => Math.min(1, prev + 1))}
                    disabled={weekOffset >= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
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
                          
                          return (
                            <button
                              key={day.date}
                              onClick={() => !isDisabled && setBookingData(prev => ({ 
                                ...prev, 
                                selectedDate: day.date, 
                                selectedTimeSlot: null 
                              }))}
                              disabled={isDisabled}
                              className={`p-3 rounded-lg text-center transition-all min-h-[80px] flex flex-col justify-center items-center gap-1 ${
                                isDisabled
                                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                  : isSelected
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
                              {day.isToday && !isDisabled && (
                                <Badge className={`text-[10px] px-2 py-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-johnson-blue/10 text-johnson-blue'}`}>
                                  Today
                                </Badge>
                              )}
                              {day.isTomorrow && !isDisabled && !day.isToday && (
                                <Badge className={`text-[10px] px-2 py-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                  Tomorrow
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Emergency Services Disclaimer */}
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                      <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div className="text-xs text-red-800 leading-relaxed">
                        <span className="font-bold">Need Emergency Service?</span> Saturdays, Sundays, and After-Hours emergency services may be available. Please call 
                        <a href="tel:6174799911" className="font-bold underline mx-1 hover:text-red-900 transition-colors">617-479-9911</a> 
                        directly to schedule.
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
                              {formatTimeSlotWindow(slot.startTime, slot.endTime)}
                            </div>
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