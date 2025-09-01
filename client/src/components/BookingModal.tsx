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
import { Calendar, X, AlertTriangle, Droplets, Flame, Wrench, Settings, Home, Zap, User, UserPlus, Clock, DollarSign } from "lucide-react";
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-auto" hideCloseButton>
        <DialogHeader className="bg-johnson-blue text-white p-4 sm:p-6 -m-4 sm:-m-6 mb-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold">Book Your Service</DialogTitle>
              <p className="text-blue-100 text-sm sm:text-base">Fast, easy scheduling in just a few steps</p>
              
              {/* Show selected time slot and service fee */}
              {selectedTimeSlot && selectedDate && (
                <div className="mt-3 bg-white/10 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-100" />
                    <div>
                      <p className="text-white font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-blue-100 text-sm">
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
                    <DollarSign className="h-5 w-5 text-blue-100" />
                    <div>
                      {isFeeWaived ? (
                        <p className="text-white">
                          <span className="line-through text-blue-200">$99 fee</span> 
                          <span className="ml-2 text-green-300 font-bold">WAIVED</span>
                        </p>
                      ) : (
                        <p className="text-white font-medium">$99 service fee</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:text-gray-300 hover:bg-white/10 touch-target ml-2"
              data-testid="close-booking-modal"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 -mx-4 sm:-mx-6">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {progressSteps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                  step.completed ? 'bg-green-500 text-white' :
                  step.active ? 'bg-johnson-blue text-white' : 
                  'bg-gray-300 text-gray-500'
                }`}>
                  {step.number}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${
                  step.active ? 'text-johnson-blue' : 'text-gray-500'
                } hidden sm:inline`}>
                  {step.label}
                </span>
                {index < progressSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-3 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-200px)]">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="step-transition-enter">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">What service do you need?</h4>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
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
                      className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors touch-target ${
                        isSelected 
                          ? 'border-johnson-blue bg-blue-50' 
                          : 'border-gray-200 hover:border-johnson-blue'
                      }`}
                      data-testid={`booking-service-${service.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${getIconColor(service.category)}`}>
                            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{service.name}</h5>
                            <p className="text-xs sm:text-sm text-gray-600">{service.description.substring(0, 60)}...</p>
                          </div>
                        </div>
                        <span className="text-johnson-blue font-bold text-sm sm:text-base flex-shrink-0 ml-2">
                          {service.basePrice === "2500.00" ? "Quote" : `$${service.basePrice}+`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 sm:mt-8 flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!selectedService}
                  className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none disabled:shadow-none w-full sm:w-auto touch-target"
                  data-testid="step1-continue-button"
                >
                  Continue to Schedule
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Schedule Selection */}
          {currentStep === 2 && (
            <div className="step-transition-enter">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">When would you like service?</h4>
              
              <div className="space-y-6 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 sm:mb-4">Select Date</h5>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="grid grid-cols-7 gap-1 mb-3 sm:mb-4">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
                          <span className="sm:hidden">{day}</span>
                          <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().slice(0, 21).map((day) => (
                        <div
                          key={day.date}
                          onClick={() => handleDateSelect(day.date)}
                          className={`text-center py-2 sm:py-3 cursor-pointer rounded transition-colors touch-target min-h-[40px] sm:min-h-[44px] flex items-center justify-center text-sm sm:text-base ${
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

                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 sm:mb-4">Available Times (EST)</h5>
                  {selectedDate ? (
                    <div className="space-y-2 max-h-64 md:max-h-none overflow-y-auto">
                      {timeSlotsLoading ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500">Loading available times...</p>
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
                              className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors time-slot-button touch-target ${
                                isSelected 
                                  ? 'border-johnson-blue bg-blue-50' 
                                  : 'border-gray-200 hover:border-johnson-blue'
                              }`}
                              data-testid={`time-slot-${slot.startTime}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm sm:text-base">
                                  {formatTimeWindowEST(startTimeOnly, endTimeOnly)}
                                </span>
                                <span className="text-xs sm:text-sm text-green-600">Available</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No available times for this date</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Select a date to see available times</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="px-6 py-3 w-full sm:w-auto touch-target order-2 sm:order-1 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                  data-testid="step2-back-button"
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!selectedDate || !selectedTimeSlot}
                  className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none disabled:shadow-none w-full sm:w-auto touch-target order-1 sm:order-2"
                  data-testid="step2-continue-button"
                >
                  Continue to Account
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Customer Type Selection */}
          {currentStep === 3 && !customerType && (
            <div className="step-transition-enter">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Are you a new or returning customer?</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setCustomerType("new")}
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-johnson-blue transition-colors group"
                  data-testid="new-customer-button"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-johnson-blue bg-opacity-10 p-4 rounded-full mb-4 group-hover:bg-opacity-20 transition-colors">
                      <UserPlus className="h-8 w-8 text-johnson-blue" />
                    </div>
                    <h5 className="font-bold text-lg mb-2">New Customer</h5>
                    <p className="text-gray-600 text-sm">Create a new account to book your service</p>
                  </div>
                </div>

                <div
                  onClick={() => setCustomerType("returning")}
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-johnson-blue transition-colors group"
                  data-testid="returning-customer-button"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-johnson-blue bg-opacity-10 p-4 rounded-full mb-4 group-hover:bg-opacity-20 transition-colors">
                      <User className="h-8 w-8 text-johnson-blue" />
                    </div>
                    <h5 className="font-bold text-lg mb-2">Returning Customer</h5>
                    <p className="text-gray-600 text-sm">Look up your existing account</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex justify-start">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="px-6 py-3 w-full sm:w-auto touch-target border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                  data-testid="step3-back-button"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3A: New Customer Form */}
          {currentStep === 3 && customerType === "new" && (
            <div className="step-transition-enter">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Create Your Account</h4>
              
              <Form {...newCustomerForm}>
                <form onSubmit={newCustomerForm.handleSubmit(handleNewCustomerSubmit)} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={newCustomerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="John"
                              data-testid="new-customer-first-name"
                            />
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
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Doe"
                              data-testid="new-customer-last-name"
                            />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="john@example.com"
                            data-testid="new-customer-email"
                          />
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
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            placeholder="(617) 555-0123"
                            data-testid="new-customer-phone"
                          />
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
                        <FormLabel>Service Address *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="123 Main St, Quincy, MA 02169"
                            data-testid="new-customer-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <Button
                      type="button"
                      onClick={() => setCustomerType(null)}
                      variant="outline"
                      className="px-6 py-3 w-full sm:w-auto touch-target order-2 sm:order-1 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                      data-testid="new-customer-back-button"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCustomerMutation.isPending}
                      className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none disabled:shadow-none w-full sm:w-auto touch-target order-1 sm:order-2"
                      data-testid="new-customer-submit-button"
                    >
                      {createCustomerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 3B: Returning Customer Form */}
          {currentStep === 3 && customerType === "returning" && (
            <div className="step-transition-enter">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Look Up Your Account</h4>
              
              <Form {...returningCustomerForm}>
                <form onSubmit={returningCustomerForm.handleSubmit(handleReturningCustomerSubmit)} className="space-y-4 sm:space-y-6">
                  <FormField
                    control={returningCustomerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="John Doe"
                            data-testid="returning-customer-name"
                          />
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
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            placeholder="(617) 555-0123"
                            data-testid="returning-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <Button
                      type="button"
                      onClick={() => setCustomerType(null)}
                      variant="outline"
                      className="px-6 py-3 w-full sm:w-auto touch-target order-2 sm:order-1 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                      data-testid="returning-customer-back-button"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={lookupCustomerMutation.isPending}
                      className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none disabled:shadow-none w-full sm:w-auto touch-target order-1 sm:order-2"
                      data-testid="returning-customer-submit-button"
                    >
                      {lookupCustomerMutation.isPending ? "Looking Up..." : "Look Up Account"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 4: Problem Description */}
          {currentStep === 4 && customer && (
            <div className="step-transition-enter">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Tell Us About Your Problem</h4>
              
              {/* Show customer info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Booking for:</p>
                <p className="font-semibold">{customer.firstName} {customer.lastName}</p>
                <p className="text-sm text-gray-600">{customer.email}</p>
                <p className="text-sm text-gray-600">{customer.phone}</p>
                <p className="text-sm text-gray-600">{customer.address}</p>
              </div>

              <Form {...problemForm}>
                <form onSubmit={problemForm.handleSubmit(handleFinalBookingSubmit)} className="space-y-4 sm:space-y-6">
                  <FormField
                    control={problemForm.control}
                    name="problemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Please describe your plumbing issue in detail. This helps our technicians come prepared with the right tools and parts..."
                            rows={5}
                            data-testid="problem-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <Button
                      type="button"
                      onClick={() => {
                        setCurrentStep(3);
                        setCustomer(null);
                        setCustomerType(null);
                      }}
                      variant="outline"
                      className="px-6 py-3 w-full sm:w-auto touch-target order-2 sm:order-1 border-2 border-gray-300 hover:border-johnson-blue hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                      data-testid="step4-back-button"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={createBookingMutation.isPending}
                      className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-6 py-3 rounded-lg font-bold hover:from-johnson-teal hover:to-johnson-blue transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none disabled:shadow-none w-full sm:w-auto touch-target order-1 sm:order-2"
                      data-testid="submit-booking-button"
                    >
                      {createBookingMutation.isPending ? "Booking..." : "Complete Booking"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}