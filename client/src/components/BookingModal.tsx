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
import { getServices, getTimeSlots, createBooking, checkServiceArea } from "@/lib/housecallApi";
import { createCustomer, lookupCustomer } from "@/lib/customerApi";
import { useToast } from "@/hooks/use-toast";
import { Calendar, X, AlertTriangle, Droplets, Flame, Wrench, Settings, Home, Zap, User, UserPlus, Clock, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { formatTimeWindowEST, convert24to12Hour } from "@/lib/timeUtils";

// Types based on schema
interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  duration: string;
  isEmergency: boolean;
}

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
}

// New Customer Form Schema
const newCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Service address is required"),
});

// Returning Customer Form Schema
const returningCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

// Problem Description Schema
const problemDescriptionSchema = z.object({
  problemDescription: z.string().optional(),
});

type NewCustomerFormValues = z.infer<typeof newCustomerSchema>;
type ReturningCustomerFormValues = z.infer<typeof returningCustomerSchema>;
type ProblemDescriptionFormValues = z.infer<typeof problemDescriptionSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedService?: string | null;
}

const serviceIcons = {
  emergency: AlertTriangle,
  maintenance: Droplets,
  installation: Flame,
  repair: Settings,
  renovation: Home,
  default: Wrench,
};

export default function BookingModal({ isOpen, onClose, preSelectedService }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [customerType, setCustomerType] = useState<"new" | "returning" | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isExpressBooking, setIsExpressBooking] = useState(false);
  const [isFeeWaived, setIsFeeWaived] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms for different steps
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

  const problemForm = useForm<ProblemDescriptionFormValues>({
    resolver: zodResolver(problemDescriptionSchema),
    defaultValues: {
      problemDescription: "",
    },
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    queryFn: getServices,
    enabled: isOpen,
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
        setCurrentStep(4); // Move to problem description
      }
    },
    onError: (error: any) => {
      // Check if the response includes an existing customer
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
        setCurrentStep(4); // Move to problem description
      }
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
      toast({
        title: "Customer Not Found",
        description: errorData?.error || "No customer found with that information. Please try again or create a new account.",
        variant: "destructive",
      });
    },
  });

  // Create Booking Mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment for ${selectedService?.name} has been scheduled. You'll receive a confirmation email shortly.`,
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
      // Check if this is an express booking
      const bookingType = sessionStorage.getItem('booking_type');
      const expressFeeWaived = sessionStorage.getItem('express_fee_waived') === 'true';
      
      if (bookingType === 'express') {
        setIsExpressBooking(true);
        setIsFeeWaived(expressFeeWaived);
        // For express bookings, auto-select today's date
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
      } else if (bookingType === 'next_day') {
        setIsFeeWaived(true); // Next day bookings always have fee waived
        // Auto-select tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
      } else {
        setIsExpressBooking(false);
        setIsFeeWaived(false);
      }
      
      if (preSelectedService && services) {
        const service = services.find((s: Service) => s.id === preSelectedService);
        if (service) {
          setSelectedService(service);
        }
      }
    }
  }, [isOpen, preSelectedService, services]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedDate("");
    setSelectedTimeSlot(null);
    setCustomerType(null);
    setCustomer(null);
    newCustomerForm.reset();
    returningCustomerForm.reset();
    problemForm.reset();
    sessionStorage.removeItem('booking_type');
    sessionStorage.removeItem('express_fee_waived');
    sessionStorage.removeItem('express_windows');
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSelect = (timeSlot: AvailableTimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedService) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedDate && selectedTimeSlot) {
      setCurrentStep(3); // Go to customer type selection
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNewCustomerSubmit = (data: NewCustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };

  const handleReturningCustomerSubmit = (data: ReturningCustomerFormValues) => {
    lookupCustomerMutation.mutate(data);
  };

  const handleFinalBookingSubmit = (data: ProblemDescriptionFormValues) => {
    if (!selectedService || !selectedTimeSlot || !customer) return;

    const bookingData: any = {
      service: selectedService.id,
      selectedDate: selectedDate,
      selectedTime: selectedTimeSlot.startTime,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      problemDescription: data.problemDescription || "",
    };

    createBookingMutation.mutate(bookingData);
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOfMonth = date.getDate();
      
      days.push({
        date: dateStr,
        dayOfWeek,
        dayOfMonth,
        isToday: i === 0,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    
    return days;
  };

  const progressSteps = [
    { number: 1, label: "Service", active: currentStep >= 1, completed: currentStep > 1 },
    { number: 2, label: "Schedule", active: currentStep >= 2, completed: currentStep > 2 },
    { number: 3, label: "Account", active: currentStep >= 3, completed: currentStep > 3 },
    { number: 4, label: "Details", active: currentStep >= 4, completed: false },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-full sm:max-w-4xl p-0 m-0 sm:m-4 rounded-none sm:rounded-lg" hideCloseButton>
        {/* Mobile-optimized header */}
        <DialogHeader className="bg-johnson-blue text-white p-4 sm:p-6 sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-2xl font-bold">Book Your Service</DialogTitle>
              <p className="text-blue-100 text-xs sm:text-base mt-1">Fast, easy scheduling</p>
              
              {/* Show selected time slot and service fee - mobile optimized */}
              {selectedTimeSlot && selectedDate && (
                <div className="mt-2 sm:mt-3 bg-white/10 rounded-lg p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100" />
                      <div className="text-sm">
                        <p className="text-white font-medium">
                          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-blue-100 text-xs">
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100" />
                      <div className="text-sm">
                        {isFeeWaived ? (
                          <p className="text-white">
                            <span className="line-through text-blue-200">$99</span> 
                            <span className="ml-1 text-green-300 font-bold text-xs">WAIVED</span>
                          </p>
                        ) : (
                          <p className="text-white font-medium">$99 fee</p>
                        )}
                      </div>
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

        {/* Mobile-optimized Progress Indicator */}
        <div className="bg-gray-50 px-4 py-2 sm:py-3 sticky top-[88px] sm:top-[120px] z-10">
          <div className="flex justify-between items-center">
            {progressSteps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
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

        {/* Mobile-optimized content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="step-transition-enter">
              <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">What service do you need?</h4>
              <div className="grid grid-cols-1 gap-2 sm:gap-4">
                {services?.map((service: Service) => {
                  const IconComponent = serviceIcons[service.category as keyof typeof serviceIcons] || serviceIcons.default;
                  const isSelected = selectedService?.id === service.id;
                  
                  const getIconColor = (category: string) => {
                    switch (category) {
                      case 'emergency': return 'text-red-600 bg-red-100';
                      case 'maintenance': return 'text-johnson-blue bg-blue-100';
                      case 'installation': return 'text-johnson-orange bg-orange-100';
                      case 'repair': return 'text-purple-600 bg-purple-100';
                      case 'renovation': return 'text-indigo-600 bg-indigo-100';
                      default: return 'text-green-600 bg-green-100';
                    }
                  };

                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors active:scale-95 ${
                        isSelected 
                          ? 'border-johnson-blue bg-blue-50' 
                          : 'border-gray-200 hover:border-johnson-blue'
                      }`}
                      data-testid={`booking-service-${service.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
                          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${getIconColor(service.category)}`}>
                            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{service.name}</h5>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{service.description}</p>
                          </div>
                        </div>
                        <span className="text-johnson-blue font-bold text-xs sm:text-base flex-shrink-0 ml-2">
                          {service.basePrice === "2500.00" ? "Quote" : `$${service.basePrice}+`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Schedule Selection - Mobile optimized */}
          {currentStep === 2 && (
            <div className="step-transition-enter">
              <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">When would you like service?</h4>
              
              <div className="space-y-4">
                {/* Date Selection */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Select Date</h5>
                  <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div key={day} className="text-center text-[10px] sm:text-sm font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                      {generateCalendarDays().slice(0, 21).map((day) => (
                        <div
                          key={day.date}
                          onClick={() => handleDateSelect(day.date)}
                          className={`text-center py-1.5 sm:py-3 cursor-pointer rounded transition-colors text-xs sm:text-base ${
                            selectedDate === day.date
                              ? 'bg-johnson-blue text-white'
                              : day.isWeekend
                              ? 'text-gray-400 hover:bg-gray-200'
                              : 'hover:bg-johnson-blue hover:text-white'
                          } ${day.isToday ? 'font-bold' : ''}`}
                          data-testid={`calendar-day-${day.date}`}
                        >
                          {day.dayOfMonth}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Available Times (EST)</h5>
                  {selectedDate ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {timeSlotsLoading ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">Loading available times...</p>
                        </div>
                      ) : timeSlots && timeSlots.length > 0 ? (
                        timeSlots.map((slot: AvailableTimeSlot) => {
                          const isSelected = selectedTimeSlot?.id === slot.id;
                          // Extract time from ISO string (HH:MM format)
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
                            <div
                              key={slot.id}
                              onClick={() => handleTimeSelect(slot)}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors active:scale-95 ${
                                isSelected 
                                  ? 'border-johnson-blue bg-blue-50' 
                                  : 'border-gray-200 hover:border-johnson-blue'
                              }`}
                              data-testid={`time-slot-${slot.startTime}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">
                                  {formatTimeWindowEST(startTimeOnly, endTimeOnly)}
                                </span>
                                <span className="text-xs text-green-600">Available</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No available times for this date</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Select a date to see available times</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customer Type Selection - Mobile optimized */}
          {currentStep === 3 && !customerType && (
            <div className="step-transition-enter">
              <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">Are you a new or returning customer?</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div
                  onClick={() => setCustomerType("new")}
                  className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 cursor-pointer hover:border-johnson-blue transition-colors group active:scale-95"
                  data-testid="new-customer-button"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-johnson-blue bg-opacity-10 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 group-hover:bg-opacity-20 transition-colors">
                      <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-johnson-blue" />
                    </div>
                    <h5 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">New Customer</h5>
                    <p className="text-gray-600 text-xs sm:text-sm">Create a new account</p>
                  </div>
                </div>

                <div
                  onClick={() => setCustomerType("returning")}
                  className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 cursor-pointer hover:border-johnson-blue transition-colors group active:scale-95"
                  data-testid="returning-customer-button"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-johnson-blue bg-opacity-10 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 group-hover:bg-opacity-20 transition-colors">
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-johnson-blue" />
                    </div>
                    <h5 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">Returning Customer</h5>
                    <p className="text-gray-600 text-xs sm:text-sm">Look up your account</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3A: New Customer Form - Mobile optimized */}
          {currentStep === 3 && customerType === "new" && (
            <div className="step-transition-enter">
              <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">Create Your Account</h4>
              
              <Form {...newCustomerForm}>
                <form onSubmit={newCustomerForm.handleSubmit(handleNewCustomerSubmit)} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                              className="h-10"
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
                              className="h-10"
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
                            className="h-10"
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
                            className="h-10"
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
                            className="h-10"
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

          {/* Step 3B: Returning Customer Form - Mobile optimized */}
          {currentStep === 3 && customerType === "returning" && (
            <div className="step-transition-enter">
              <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">Look Up Your Account</h4>
              
              <Form {...returningCustomerForm}>
                <form onSubmit={returningCustomerForm.handleSubmit(handleReturningCustomerSubmit)} className="space-y-3 sm:space-y-4">
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
                            className="h-10"
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
                            className="h-10"
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

          {/* Step 4: Problem Description - Mobile optimized */}
          {currentStep === 4 && customer && (
            <div className="step-transition-enter">
              <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">Tell Us About Your Problem</h4>
              
              {/* Show customer info */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Booking for:</p>
                <p className="font-semibold text-sm sm:text-base">{customer.firstName} {customer.lastName}</p>
                <p className="text-xs sm:text-sm text-gray-600">{customer.email}</p>
                <p className="text-xs sm:text-sm text-gray-600">{customer.phone}</p>
                <p className="text-xs sm:text-sm text-gray-600">{customer.address}</p>
              </div>

              <Form {...problemForm}>
                <form onSubmit={problemForm.handleSubmit(handleFinalBookingSubmit)} className="space-y-3 sm:space-y-4">
                  <FormField
                    control={problemForm.control}
                    name="problemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Problem Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Please describe your plumbing issue in detail. This helps our technicians come prepared with the right tools and parts..."
                            rows={4}
                            className="text-sm"
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
        </div>

        {/* Mobile-optimized footer buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between gap-3">
          {currentStep === 1 && (
            <>
              <div className="w-1/3"></div>
              <Button
                onClick={nextStep}
                disabled={!selectedService}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-2.5 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1"
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
                className="px-6 py-2.5 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300"
                data-testid="step2-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!selectedDate || !selectedTimeSlot}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-2.5 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1"
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
                className="px-6 py-2.5 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300"
                data-testid="step3-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
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
                className="px-6 py-2.5 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300"
                data-testid="new-customer-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={newCustomerForm.handleSubmit(handleNewCustomerSubmit)}
                disabled={createCustomerMutation.isPending}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-2.5 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1"
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
                className="px-6 py-2.5 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300"
                data-testid="returning-customer-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={returningCustomerForm.handleSubmit(handleReturningCustomerSubmit)}
                disabled={lookupCustomerMutation.isPending}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-2.5 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1"
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
                className="px-6 py-2.5 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300"
                data-testid="step4-back-button"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={problemForm.handleSubmit(handleFinalBookingSubmit)}
                disabled={createBookingMutation.isPending}
                className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-2.5 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none flex-1"
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