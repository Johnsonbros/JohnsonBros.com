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
import { getTimeSlots, createBooking } from "@/lib/housecallApi";
import { createCustomer, lookupCustomer } from "@/lib/customerApi";
import { useToast } from "@/hooks/use-toast";
import { Calendar, X, User, UserPlus, Clock, DollarSign, ChevronLeft, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { formatTimeWindowEST } from "@/lib/timeUtils";

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

// Form Schemas
const problemDescriptionSchema = z.object({
  problemDescription: z.string().min(10, "Please describe your plumbing issue (at least 10 characters)"),
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

type ProblemDescriptionFormValues = z.infer<typeof problemDescriptionSchema>;
type NewCustomerFormValues = z.infer<typeof newCustomerSchema>;
type ReturningCustomerFormValues = z.infer<typeof returningCustomerSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedService?: string | null;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [customerType, setCustomerType] = useState<"new" | "returning" | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [isExpressBooking, setIsExpressBooking] = useState(false);
  const [isFeeWaived, setIsFeeWaived] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const problemForm = useForm<ProblemDescriptionFormValues>({
    resolver: zodResolver(problemDescriptionSchema),
    defaultValues: {
      problemDescription: "",
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

  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ["/api/timeslots", selectedDate],
    queryFn: () => getTimeSlots(selectedDate),
    enabled: !!selectedDate,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
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
      
      if (bookingType === 'express') {
        setIsExpressBooking(true);
        setIsFeeWaived(expressFeeWaived);
        // Get today's date in EST/EDT
        const now = new Date();
        const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
        const estDate = new Date(estString);
        estDate.setHours(0, 0, 0, 0);
        const today = estDate.toISOString().split('T')[0];
        setSelectedDate(today);
        // Store in localStorage as backup
        localStorage.setItem('booking_type', 'express');
        localStorage.setItem('express_fee_waived', expressFeeWaived.toString());
      } else if (bookingType === 'next_day') {
        setIsFeeWaived(true);
        // Get tomorrow's date in EST/EDT
        const now = new Date();
        const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
        const estDate = new Date(estString);
        estDate.setDate(estDate.getDate() + 1);
        estDate.setHours(0, 0, 0, 0);
        const tomorrow = estDate.toISOString().split('T')[0];
        setSelectedDate(tomorrow);
        // Store in localStorage as backup
        localStorage.setItem('booking_type', 'next_day');
        localStorage.setItem('express_fee_waived', 'true');
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
    setSelectedDate("");
    setSelectedTimeSlot(null);
    setCustomerType(null);
    setCustomer(null);
    setProblemDescription("");
    problemForm.reset();
    newCustomerForm.reset();
    returningCustomerForm.reset();
    // Clear both sessionStorage and localStorage
    sessionStorage.removeItem('booking_type');
    sessionStorage.removeItem('express_fee_waived');
    sessionStorage.removeItem('express_windows');
    localStorage.removeItem('booking_type');
    localStorage.removeItem('express_fee_waived');
    localStorage.removeItem('express_windows');
  };

  const handleProblemSubmit = (data: ProblemDescriptionFormValues) => {
    setProblemDescription(data.problemDescription);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSelect = (timeSlot: AvailableTimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleNewCustomerSubmit = (data: NewCustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };

  const handleReturningCustomerSubmit = (data: ReturningCustomerFormValues) => {
    lookupCustomerMutation.mutate(data);
  };

  const handleFinalBookingSubmit = async () => {
    if (!selectedTimeSlot || !customer || !problemDescription) return;

    // Re-validate that the time slot is still available
    try {
      const currentSlots = await getTimeSlots(selectedDate);
      const slotStillAvailable = currentSlots.some(
        (slot: AvailableTimeSlot) => slot.id === selectedTimeSlot.id && slot.isAvailable
      );
      
      if (!slotStillAvailable) {
        toast({
          title: "Time Slot No Longer Available",
          description: "The selected time slot is no longer available. Please select a different time.",
          variant: "destructive",
        });
        setCurrentStep(2); // Go back to time selection
        setSelectedTimeSlot(null);
        queryClient.invalidateQueries({ queryKey: ["/api/timeslots", selectedDate] });
        return;
      }
    } catch (error) {
      console.error("Failed to validate time slot:", error);
      // Continue with booking if validation fails to not block the user
    }

    // Extract time in HH:MM format from the ISO string
    const timeObj = new Date(selectedTimeSlot.startTime);
    const formattedTime = `${timeObj.getHours().toString().padStart(2, '0')}:${timeObj.getMinutes().toString().padStart(2, '0')}`;

    const bookingData: any = {
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
      selectedDate: selectedDate,
      selectedTime: formattedTime,
      problemDescription: problemDescription
    };

    createBookingMutation.mutate(bookingData);
  };

  const nextStep = () => {
    if (currentStep === 2 && selectedDate && selectedTimeSlot) {
      setCurrentStep(3); // Go to customer info
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateCalendarDays = () => {
    // Get current date in EST/EDT timezone
    const now = new Date();
    const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estString);
    
    // Create a date object for today at midnight EST
    const todayEST = new Date(estDate);
    todayEST.setHours(0, 0, 0, 0);
    const todayESTStr = todayEST.toISOString().split('T')[0];
    
    const days = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(todayEST);
      date.setDate(todayEST.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOfMonth = date.getDate();
      
      days.push({
        date: dateStr,
        dayOfWeek,
        dayOfMonth,
        isToday: dateStr === todayESTStr,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    
    return days;
  };

  const progressSteps = [
    { number: 1, label: "Issue", active: currentStep >= 1, completed: currentStep > 1 },
    { number: 2, label: "Schedule", active: currentStep >= 2, completed: currentStep > 2 },
    { number: 3, label: "Info", active: currentStep >= 3, completed: currentStep > 3 },
    { number: 4, label: "Confirm", active: currentStep >= 4, completed: false },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] max-w-full sm:max-w-4xl p-0 m-0 sm:m-4 rounded-none sm:rounded-lg overflow-hidden" hideCloseButton>
        {/* Mobile-optimized header */}
        <DialogHeader className="bg-johnson-blue text-white p-4 sm:p-6 sticky top-0 z-20 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-2xl font-bold">Book Your Service</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-blue-100" />
                <p className="text-blue-100 text-sm sm:text-base">
                  $99 Service Fee
                  {isFeeWaived && <span className="ml-2 text-green-300 font-bold">WAIVED TODAY</span>}
                </p>
              </div>
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
        <div className="bg-gray-50 px-4 py-2 sm:py-3 sticky top-[76px] sm:top-[88px] z-10 shadow-sm">
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
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 240px)' }}>
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
                      name="problemDescription"
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
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={`weekday-${index}`} className="text-center text-[10px] sm:text-sm font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().slice(0, 21).map((day) => (
                          <button
                            key={day.date}
                            type="button"
                            onClick={() => handleDateSelect(day.date)}
                            className={`text-center py-2 sm:py-3 rounded transition-colors text-xs sm:text-base ${
                              selectedDate === day.date
                                ? 'bg-johnson-blue text-white'
                                : day.isWeekend
                                ? 'text-gray-400 hover:bg-gray-200'
                                : 'hover:bg-johnson-blue hover:text-white'
                            } ${day.isToday ? 'font-bold ring-2 ring-johnson-orange' : ''}`}
                            data-testid={`calendar-day-${day.date}`}
                          >
                            {day.dayOfMonth}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Available Times (EST)</h5>
                    {selectedDate ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {timeSlotsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-johnson-blue mx-auto"></div>
                            <p className="text-gray-500 text-sm mt-2">Loading available times...</p>
                          </div>
                        ) : timeSlots && timeSlots.length > 0 ? (
                          timeSlots.map((slot: AvailableTimeSlot) => {
                            const isSelected = selectedTimeSlot?.id === slot.id;
                            const startTimeOnly = new Date(slot.startTime).toLocaleTimeString('en-US', {
                              hour12: false,
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            const endTimeOnly = new Date(slot.endTime).toLocaleTimeString('en-US', {
                              hour12: false,
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            
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
                                      {formatTimeWindowEST(startTimeOnly, endTimeOnly)}
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
                <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-4">Confirm Your Booking</h4>
                
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
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {selectedTimeSlot && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatTimeWindowEST(
                          new Date(selectedTimeSlot.startTime).toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                          new Date(selectedTimeSlot.endTime).toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        )}
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

                  {/* Service Fee */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Service Fee</span>
                      <span className={`font-bold ${isFeeWaived ? 'text-green-600' : 'text-gray-900'}`}>
                        {isFeeWaived ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">$99</span>
                            WAIVED
                          </>
                        ) : (
                          '$99.00'
                        )}
                      </span>
                    </div>
                  </div>
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
                disabled={!problemForm.watch('problemDescription')}
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
                disabled={!selectedDate || !selectedTimeSlot}
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