import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  AlertCircle, MapPin, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface BookingData {
  selectedService: any;
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

export default function BookingModal({ isOpen, onClose, preSelectedService }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
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
  const [customerType, setCustomerType] = useState<"new" | "returning" | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
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

  // Load services - with staleTime to prevent duplicate calls
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/v1/services"],
    queryFn: getServices,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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

  // Auto-select the express/next_day time slot when slots load
  useEffect(() => {
    if (timeSlots && timeSlots.length > 0 && bookingData.selectedDate && !bookingData.selectedTimeSlot) {
      const bookingTimeSlot = sessionStorage.getItem('booking_time_slot') || localStorage.getItem('booking_time_slot');
      
      if (bookingTimeSlot) {
        const [startTime, endTime] = bookingTimeSlot.split(' - ');
        
        // Find the matching slot from the API by comparing formatted times
        const matchingSlot = timeSlots.find((slot: AvailableTimeSlot) => {
          const slotStartTime = new Date(slot.startTime).toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });
          const slotEndTime = new Date(slot.endTime).toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });
          
          return slotStartTime === startTime && slotEndTime === endTime;
        });
        
        if (matchingSlot) {
          setBookingData(prev => ({ ...prev, selectedTimeSlot: matchingSlot }));
        }
      }
    }
  }, [timeSlots, bookingData.selectedDate, bookingData.selectedTimeSlot]);

  // Create Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data: any) => {
      if (data.customer) {
        setCustomer(data.customer);
        setCurrentStep(4); // Move to confirmation
      }
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
      if (errorData?.customer) {
        setCustomer(errorData.customer);
        setCurrentStep(4);
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
        setCustomer(data.customer);
        setCurrentStep(4); // Move to confirmation
      }
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
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
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      // Check if this is an express booking - also check localStorage as fallback
      const bookingType = sessionStorage.getItem('booking_type') || localStorage.getItem('booking_type');
      const expressFeeWaived = sessionStorage.getItem('express_fee_waived') === 'true' || 
                               localStorage.getItem('express_fee_waived') === 'true';
      const bookingTimeSlot = sessionStorage.getItem('booking_time_slot') || localStorage.getItem('booking_time_slot');
      
      if (bookingType === 'express') {
        setIsExpressBooking(true);
        setIsFeeWaived(expressFeeWaived);
        // Get today's date in EST/EDT
        const now = new Date();
        const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
        const estDate = new Date(estString);
        estDate.setHours(0, 0, 0, 0);
        const today = estDate.toISOString().split('T')[0];
        setBookingData(prev => ({ ...prev, selectedDate: today }));
        
        // Time slot will be auto-selected when slots load (see useEffect below)
        
        // Store in localStorage as backup
        localStorage.setItem('booking_type', 'express');
        localStorage.setItem('express_fee_waived', expressFeeWaived.toString());
        if (bookingTimeSlot) {
          localStorage.setItem('booking_time_slot', bookingTimeSlot);
        }
      } else if (bookingType === 'next_day') {
        setIsFeeWaived(true);
        // Get tomorrow's date in EST/EDT
        const now = new Date();
        const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
        const estDate = new Date(estString);
        estDate.setDate(estDate.getDate() + 1);
        estDate.setHours(0, 0, 0, 0);
        const tomorrow = estDate.toISOString().split('T')[0];
        setBookingData(prev => ({ ...prev, selectedDate: tomorrow }));
        
        // Time slot will be auto-selected when slots load (see useEffect below)
        
        // Store in localStorage as backup
        localStorage.setItem('booking_type', 'next_day');
        localStorage.setItem('express_fee_waived', 'true');
        if (bookingTimeSlot) {
          localStorage.setItem('booking_time_slot', bookingTimeSlot);
        }
      } else {
        setIsExpressBooking(false);
        setIsFeeWaived(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setBookingData(prev => ({ ...prev, selectedDate: "", selectedTimeSlot: null }));
    setCustomerType(null);
    setCustomer(null);
    setProblemDescription("");
    setPhotos([]);
    problemForm.reset();
    newCustomerForm.reset();
    returningCustomerForm.reset();
    // Clear both sessionStorage and localStorage
    sessionStorage.removeItem('booking_type');
    sessionStorage.removeItem('express_fee_waived');
    sessionStorage.removeItem('express_windows');
    sessionStorage.removeItem('booking_time_slot');
    localStorage.removeItem('booking_type');
    localStorage.removeItem('express_fee_waived');
    localStorage.removeItem('express_windows');
    localStorage.removeItem('booking_time_slot');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxPhotos = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Too Many Photos",
        description: `You can only upload up to ${maxPhotos} photos`,
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload only image files",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Maximum size is 5MB`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        setPhotos(prev => [...prev, {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          mimeType: file.type,
          base64: base64Data,
          preview: base64,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleProblemSubmit = (data: ProblemDetailsFormValues) => {
    setProblemDescription(data.description);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: string) => {
    setBookingData(prev => ({ ...prev, selectedDate: date, selectedTimeSlot: null }));
  };

  const handleTimeSelect = (timeSlot: AvailableTimeSlot) => {
    setBookingData(prev => ({ ...prev, selectedTimeSlot: timeSlot }));
  };

  const handleNewCustomerSubmit = (data: NewCustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };

  const handleReturningCustomerSubmit = (data: ReturningCustomerFormValues) => {
    lookupCustomerMutation.mutate(data);
  };

  const handleFinalBookingSubmit = async () => {
    if (!bookingData.selectedTimeSlot || !customer || !problemDescription) return;

    // Re-validate that the time slot is still available
    try {
      const currentSlots = await getTimeSlots(bookingData.selectedDate);
      const slotStillAvailable = currentSlots.some(
        (slot: AvailableTimeSlot) => slot.id === bookingData.selectedTimeSlot?.id && slot.isAvailable
      );
      
      if (!slotStillAvailable) {
        toast({
          title: "Time Slot No Longer Available",
          description: "The selected time slot is no longer available. Please select a different time.",
          variant: "destructive",
        });
        setCurrentStep(2); // Go back to time selection
        setBookingData(prev => ({ ...prev, selectedTimeSlot: null }));
        queryClient.invalidateQueries({ queryKey: ["/api/v1/timeslots", bookingData.selectedDate] });
        return;
      }
    } catch (error) {
      console.error("Failed to validate time slot:", error);
      // Continue with booking if validation fails to not block the user
    }

    // Extract time in HH:MM format from the ISO string
    const timeObj = new Date(bookingData.selectedTimeSlot.startTime);
    const formattedTime = `${timeObj.getHours().toString().padStart(2, '0')}:${timeObj.getMinutes().toString().padStart(2, '0')}`;

    const bookingPayload: any = {
      customerInfo: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city || "Quincy",
        state: customer.state || "MA",
        zipCode: customer.zipCode || "02169"
      },
      selectedDate: bookingData.selectedDate,
      selectedTime: formattedTime,
      problemDescription: problemDescription,
      photos: photos.map((p: PhotoUpload) => ({
        filename: p.filename,
        mimeType: p.mimeType,
        base64: p.base64
      }))
    };

    createBookingMutation.mutate(bookingPayload);
  };

  const nextStep = () => {
    if (currentStep === 2 && bookingData.selectedDate && bookingData.selectedTimeSlot) {
      setCurrentStep(3); // Go to customer info
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateCalendarDays = (monthOffset: number) => {
    // Get current date in EST/EDT timezone
    const now = new Date();
    const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estString);
    
    // Create a date object for today at midnight EST
    const todayEST = new Date(estDate);
    todayEST.setHours(0, 0, 0, 0);
    const todayESTStr = todayEST.toISOString().split('T')[0];
    
    // Calculate the month to display
    const displayMonth = new Date(todayEST);
    displayMonth.setMonth(displayMonth.getMonth() + monthOffset);
    
    // Get first day of the display month
    const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);
    
    // Get the day of week for the first date (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty cells for proper alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        date: '',
        dayOfWeek: '',
        dayOfMonth: '',
        month: '',
        isToday: false,
        isWeekend: false,
        isEmpty: true,
        isSelectable: false,
      });
    }
    
    // Calculate the 30-day booking window end date
    const maxBookingDate = new Date(todayEST);
    maxBookingDate.setDate(maxBookingDate.getDate() + 29); // 30 days from today (0-indexed)
    
    // Add actual dates for the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Check if this date is within the 30-day booking window
      const isSelectable = date >= todayEST && date <= maxBookingDate;
      
      days.push({
        date: dateStr,
        dayOfWeek,
        dayOfMonth: day,
        month,
        isToday: dateStr === todayESTStr,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isEmpty: false,
        isSelectable,
      });
    }
    
    return days;
  };

  const getMonthInfo = (monthOffset: number) => {
    const now = new Date();
    const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estString);
    const displayMonth = new Date(estDate);
    displayMonth.setMonth(displayMonth.getMonth() + monthOffset);
    return displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const canGoToPreviousMonth = () => currentMonth > 0;
  
  const canGoToNextMonth = () => {
    const now = new Date();
    const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estString);
    const nextMonth = new Date(estDate);
    nextMonth.setMonth(nextMonth.getMonth() + currentMonth + 1);
    
    // Check if next month contains any dates within 30-day window
    const maxBookingDate = new Date(estDate);
    maxBookingDate.setDate(maxBookingDate.getDate() + 29);
    
    const firstDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    return firstDayOfNextMonth <= maxBookingDate;
  };

  const progressSteps = [
    { number: 1, label: "Issue", active: currentStep >= 1, completed: currentStep > 1 },
    { number: 2, label: "Schedule", active: currentStep >= 2, completed: currentStep > 2 },
    { number: 3, label: "Info", active: currentStep >= 3, completed: currentStep > 3 },
    { number: 4, label: "Confirm", active: currentStep >= 4, completed: false },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] max-w-full sm:max-w-4xl p-0 m-0 sm:m-4 rounded-none sm:rounded-lg flex flex-col overflow-hidden" hideCloseButton>
        {/* Mobile-optimized header */}
        <DialogHeader className="bg-johnson-blue text-white p-4 sm:p-6 flex-shrink-0 z-20 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-2xl font-bold">Schedule Your Plumbing Service</DialogTitle>
              <div className="mt-1">
                <p className="text-blue-100 text-sm sm:text-base">
                  {isFeeWaived ? (
                    <>
                      Our licensed technician will diagnose your issue and provide a repair quote
                    </>
                  ) : (
                    <>
                      Our technician will diagnose your issue, provide a repair quote, and apply the $99 service fee toward any approved repairs
                    </>
                  )}
                </p>
              </div>
              
              {/* HUGE Prominent Service Fee Waived Banner */}
              {isFeeWaived && (
                <div className="mt-3 sm:mt-4 animate-pulse">
                  <div className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border-2 border-green-300 transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg animate-bounce" />
                      <div className="text-center">
                        <div className="text-xl sm:text-3xl font-black text-white drop-shadow-md tracking-tight">
                          $99 SERVICE FEE
                        </div>
                        <div className="text-2xl sm:text-4xl font-black text-white drop-shadow-md -mt-1">
                          WAIVED TODAY!
                        </div>
                      </div>
                      <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg animate-bounce" />
                    </div>
                    <div className="text-center mt-1 sm:mt-2 text-xs sm:text-sm font-bold text-green-900 bg-white/30 rounded-lg px-2 py-1 backdrop-blur-sm">
                      🎉 Limited Time Offer - Book Now to Save!
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:text-gray-300 hover:bg-white/10 -mr-2 -mt-2"
              data-testid="close-booking-modal"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="bg-gray-50 px-4 py-2 sm:py-3 flex-shrink-0 z-10 shadow-sm">
          <div className="flex justify-between items-center">
            {progressSteps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                  step.completed ? 'bg-green-500 text-white' :
                  step.active ? 'bg-johnson-blue text-white' : 
                  'bg-gray-300 text-gray-500'
                }`}>
                  {step.number}
                </div>
                <span className={`ml-1 text-[10px] sm:text-sm font-medium ${
                  step.active ? 'text-johnson-blue' : 'text-gray-500'
                } ${index === 0 || index === 3 ? 'inline' : 'hidden sm:inline'}`}>
                  {step.label}
                </span>
                {index < progressSteps.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 sm:mx-2 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content area with proper mobile height */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6">
            {/* Step 1: Problem Description */}
            {currentStep === 1 && (
              <div className="step-transition-enter">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-johnson-blue" />
                  <h4 className="text-base sm:text-xl font-bold text-gray-900">What plumbing issue are you experiencing?</h4>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    Please describe your plumbing problem in detail. This helps our technicians arrive prepared with the right tools and parts.
                  </p>
                </div>

                <Form {...problemForm}>
                  <form onSubmit={problemForm.handleSubmit(handleProblemSubmit)} className="space-y-4">
                    <FormField
                      control={problemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">Problem Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Example: My kitchen sink is draining very slowly and makes gurgling sounds. It started about a week ago and has been getting worse..."
                              rows={6}
                              className="text-sm sm:text-base resize-none"
                              data-testid="problem-description"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Photo Upload Section */}
                    <div className="space-y-3">
                      <Label className="text-sm sm:text-base flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Add Photos (Optional)
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Photos help our technicians prepare for your service. Up to 5 photos, max 5MB each.
                      </p>

                      <div className="space-y-3">
                        {/* Upload Button */}
                        {photos.length < 5 && (
                          <label 
                            htmlFor="photo-upload" 
                            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-johnson-blue hover:bg-blue-50 transition-colors"
                            data-testid="photo-upload-button"
                          >
                            <Upload className="h-5 w-5 text-gray-500" />
                            <span className="text-sm text-gray-700">Click to upload photos</span>
                            <input
                              id="photo-upload"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>
                        )}

                        {/* Photo Previews */}
                        {photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {photos.map((photo, index) => (
                              <div 
                                key={index} 
                                className="relative group rounded-lg overflow-hidden border border-gray-200"
                                data-testid={`photo-preview-${index}`}
                              >
                                <img
                                  src={photo.preview}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-24 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`remove-photo-${index}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                  {photo.filename}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Step 2: Schedule Selection */}
            {currentStep === 2 && (
              <div className="step-transition-enter">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-johnson-blue" />
                  <h4 className="text-base sm:text-xl font-bold text-gray-900">When would you like service?</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Select Date</h5>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      {/* Month Header with Navigation */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(currentMonth - 1)}
                          disabled={!canGoToPreviousMonth()}
                          className={`p-2 rounded-lg transition-colors ${
                            canGoToPreviousMonth()
                              ? 'hover:bg-gray-200 text-gray-700'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          data-testid="prev-month-button"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        <h6 className="text-center text-base sm:text-lg font-bold text-gray-700">
                          {getMonthInfo(currentMonth)}
                        </h6>
                        
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(currentMonth + 1)}
                          disabled={!canGoToNextMonth()}
                          className={`p-2 rounded-lg transition-colors ${
                            canGoToNextMonth()
                              ? 'hover:bg-gray-200 text-gray-700'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          data-testid="next-month-button"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={`weekday-${index}`} className="text-center text-[10px] sm:text-sm font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays(currentMonth).map((day, index) => (
                          day.isEmpty ? (
                            <div key={`empty-${index}`} className="py-2 sm:py-3"></div>
                          ) : (
                            <button
                              key={day.date}
                              type="button"
                              onClick={() => day.isSelectable && handleDateSelect(day.date)}
                              disabled={!day.isSelectable}
                              className={`text-center py-2 sm:py-3 rounded transition-colors text-xs sm:text-base ${
                                !day.isSelectable
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : bookingData.selectedDate === day.date
                                  ? 'bg-johnson-blue text-white'
                                  : day.isWeekend
                                  ? 'text-gray-400 hover:bg-gray-200'
                                  : 'hover:bg-johnson-blue hover:text-white'
                              } ${day.isToday ? 'font-bold ring-2 ring-johnson-orange' : ''}`}
                              data-testid={`calendar-day-${day.date}`}
                            >
                              {day.dayOfMonth}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Available Times</h5>
                    {/* Weekend Emergency Badge */}
                    {bookingData.selectedDate && isWeekendDate(bookingData.selectedDate) && (
                      <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-orange-700 text-sm">Call for Emergency Service Availability</span>
                            <p className="text-xs text-orange-600 mt-0.5">Weekend service is limited. Call <a href="tel:6174799911" className="underline font-medium">(617) 479-9911</a> for urgent plumbing needs.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {bookingData.selectedDate ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {timeSlotsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-johnson-blue mx-auto"></div>
                            <p className="text-gray-500 text-sm mt-2">Loading available times...</p>
                          </div>
                        ) : timeSlots && timeSlots.length > 0 ? (
                          timeSlots.map((slot: AvailableTimeSlot) => {
                            const isSelected = bookingData.selectedTimeSlot?.id === slot.id;
                            
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => handleTimeSelect(slot)}
                                className={`w-full border rounded-lg p-3 transition-all text-left ${
                                  isSelected 
                                    ? 'border-johnson-blue bg-blue-50 shadow-md' 
                                    : 'border-gray-200 hover:border-johnson-blue hover:shadow-sm'
                                }`}
                                data-testid={`time-slot-${slot.startTime}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium text-sm sm:text-base">
                                      {formatTimeSlotWindow(slot.startTime, slot.endTime)}
                                    </span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-700 text-xs">Available</Badge>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No available times for this date</p>
                            <p className="text-xs mt-1">Please select another date</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Select a date to see available times</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Customer Type Selection */}
            {currentStep === 3 && !customerType && (
              <div className="step-transition-enter">
                <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-4">Are you a new or returning customer?</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setCustomerType("new")}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-johnson-blue transition-all group hover:shadow-md"
                    data-testid="new-customer-button"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-johnson-blue bg-opacity-10 p-4 rounded-full mb-3 group-hover:bg-opacity-20 transition-colors">
                        <UserPlus className="h-8 w-8 text-johnson-blue" />
                      </div>
                      <h5 className="font-bold text-lg mb-1">New Customer</h5>
                      <p className="text-gray-600 text-sm">Create a new account</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomerType("returning")}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-johnson-blue transition-all group hover:shadow-md"
                    data-testid="returning-customer-button"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-johnson-blue bg-opacity-10 p-4 rounded-full mb-3 group-hover:bg-opacity-20 transition-colors">
                        <User className="h-8 w-8 text-johnson-blue" />
                      </div>
                      <h5 className="font-bold text-lg mb-1">Returning Customer</h5>
                      <p className="text-gray-600 text-sm">Look up your account</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3A: New Customer Form */}
            {currentStep === 3 && customerType === "new" && (
              <div className="step-transition-enter">
                <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-4">Create Your Account</h4>
                
                <Form {...newCustomerForm}>
                  <form onSubmit={newCustomerForm.handleSubmit(handleNewCustomerSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={newCustomerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">First Name *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="John"
                                className="h-11"
                                data-testid="new-customer-first-name"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={newCustomerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Last Name *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Doe"
                                className="h-11"
                                data-testid="new-customer-last-name"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={newCustomerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="john@example.com"
                              className="h-11"
                              data-testid="new-customer-email"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newCustomerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel"
                              placeholder="(617) 555-0123"
                              className="h-11"
                              data-testid="new-customer-phone"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newCustomerForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Service Address *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="123 Main St, Quincy, MA 02169"
                              className="h-11"
                              data-testid="new-customer-address"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            )}

            {/* Step 3B: Returning Customer Form */}
            {currentStep === 3 && customerType === "returning" && (
              <div className="step-transition-enter">
                <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-4">Look Up Your Account</h4>
                
                <Form {...returningCustomerForm}>
                  <form onSubmit={returningCustomerForm.handleSubmit(handleReturningCustomerSubmit)} className="space-y-4">
                    <FormField
                      control={returningCustomerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Your Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="John Doe"
                              className="h-11"
                              data-testid="returning-customer-name"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={returningCustomerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel"
                              placeholder="(617) 555-0123"
                              className="h-11"
                              data-testid="returning-customer-phone"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && customer && (
              <div className="step-transition-enter">
                <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-4">Review & Confirm Your Service Appointment</h4>
                
                {/* Booking Summary */}
                <div className="space-y-4">
                  {/* Problem Description */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-sm text-gray-700 mb-2">Problem Description</h5>
                    <p className="text-sm text-gray-600">{problemDescription}</p>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-sm text-gray-700 mb-2">Appointment Time</h5>
                    <p className="text-sm text-gray-600">
                      {new Date(bookingData.selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {bookingData.selectedTimeSlot && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatTimeSlotWindow(bookingData.selectedTimeSlot.startTime, bookingData.selectedTimeSlot.endTime)}
                      </p>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-sm text-gray-700 mb-2">Customer Information</h5>
                    <p className="text-sm text-gray-600">{customer.firstName} {customer.lastName}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    <p className="text-sm text-gray-600">{customer.address}</p>
                  </div>

                  {/* Service Fee - Enhanced for Waived Display */}
                  {isFeeWaived ? (
                    <div className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 border-4 border-green-300 rounded-2xl p-5 shadow-2xl animate-pulse">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Gift className="h-8 w-8 text-white animate-bounce" />
                          <div>
                            <div className="text-3xl font-black text-white drop-shadow-lg">
                              YOU SAVE $99!
                            </div>
                            <div className="text-sm font-bold text-green-900 bg-white/40 rounded-lg px-3 py-1 inline-block mt-1">
                              Service Fee Waived Today
                            </div>
                          </div>
                          <Gift className="h-8 w-8 text-white animate-bounce" />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-white text-base font-semibold bg-white/20 rounded-lg p-2">
                          <Info className="h-4 w-4 flex-shrink-0" />
                          <span>
                            This normally covers our technician's time to diagnose your issue and provide a repair quote
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-gray-700">Service Call Fee</span>
                        </div>
                        <span className="font-bold text-gray-900">$99.00</span>
                      </div>
                      <div className="text-xs text-gray-600 flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>
                          This fee covers our licensed technician's time to diagnose your plumbing issue and provide you with a detailed repair quote. The fee is applied toward any repairs you approve.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons - Fixed at bottom on mobile */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between gap-3 shadow-lg">
          {currentStep === 1 && (
            <>
              <div className="w-1/3"></div>
              <Button
                onClick={problemForm.handleSubmit(handleProblemSubmit)}
                disabled={!problemForm.watch('description')}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1 text-sm sm:text-base"
                data-testid="step1-continue-button"
              >
                Continue
              </Button>
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <Button
                onClick={prevStep}
                variant="outline"
                className="px-4 sm:px-6 py-3 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                data-testid="step2-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                onClick={nextStep}
                disabled={!bookingData.selectedDate || !bookingData.selectedTimeSlot}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1 text-sm sm:text-base"
                data-testid="step2-continue-button"
              >
                Continue
              </Button>
            </>
          )}
          
          {currentStep === 3 && !customerType && (
            <>
              <Button
                onClick={prevStep}
                variant="outline"
                className="px-4 sm:px-6 py-3 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                data-testid="step3-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex-1"></div>
            </>
          )}
          
          {currentStep === 3 && customerType === "new" && (
            <>
              <Button
                type="button"
                onClick={() => setCustomerType(null)}
                variant="outline"
                className="px-4 sm:px-6 py-3 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                data-testid="new-customer-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                onClick={newCustomerForm.handleSubmit(handleNewCustomerSubmit)}
                disabled={createCustomerMutation.isPending}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1 text-sm sm:text-base"
                data-testid="new-customer-submit-button"
              >
                {createCustomerMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </>
          )}
          
          {currentStep === 3 && customerType === "returning" && (
            <>
              <Button
                type="button"
                onClick={() => setCustomerType(null)}
                variant="outline"
                className="px-4 sm:px-6 py-3 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                data-testid="returning-customer-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                onClick={returningCustomerForm.handleSubmit(handleReturningCustomerSubmit)}
                disabled={lookupCustomerMutation.isPending}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1 text-sm sm:text-base"
                data-testid="returning-customer-submit-button"
              >
                {lookupCustomerMutation.isPending ? "Looking Up..." : "Look Up"}
              </Button>
            </>
          )}
          
          {currentStep === 4 && (
            <>
              <Button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                  setCustomer(null);
                  setCustomerType(null);
                }}
                variant="outline"
                className="px-4 sm:px-6 py-3 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                data-testid="step4-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                onClick={handleFinalBookingSubmit}
                disabled={createBookingMutation.isPending}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1 text-sm sm:text-base"
                data-testid="submit-booking-button"
              >
                {createBookingMutation.isPending ? "Booking..." : "Complete Booking"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}