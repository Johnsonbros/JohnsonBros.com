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
import { useToast } from "@/hooks/use-toast";
import { Calendar, X, AlertTriangle, Droplets, Flame, Wrench, Settings, Home } from "lucide-react";
import { z } from "zod";
import type { Service, AvailableTimeSlot, BookingFormData } from "@shared/schema";

const bookingFormSchema = z.object({
  service: z.string().min(1, "Please select a service"),
  selectedDate: z.string().min(1, "Please select a date"),
  selectedTime: z.string().min(1, "Please select a time"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Service address is required"),
  problemDescription: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      service: "",
      selectedDate: "",
      selectedTime: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
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

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment has been scheduled for ${selectedService?.name}. You'll receive a confirmation email shortly.`,
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

  const checkServiceAreaMutation = useMutation({
    mutationFn: checkServiceArea,
    onSuccess: (data) => {
      if (!data.inServiceArea) {
        toast({
          title: "Service Area Check",
          description: data.message,
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (isOpen && preSelectedService && services) {
      const service = services.find(s => s.id === preSelectedService);
      if (service) {
        setSelectedService(service);
        form.setValue("service", service.id);
      }
    }
  }, [isOpen, preSelectedService, services, form]);

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
    form.reset();
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    form.setValue("service", service.id);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    form.setValue("selectedDate", date);
    form.setValue("selectedTime", "");
  };

  const handleTimeSelect = (timeSlot: AvailableTimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    form.setValue("selectedTime", timeSlot.startTime);
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedService) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedDate && selectedTimeSlot) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: BookingFormValues) => {
    if (!selectedService || !selectedTimeSlot) return;

    // Check service area first
    checkServiceAreaMutation.mutate(data.address);

    const bookingData: BookingFormData = {
      service: data.service,
      selectedDate: data.selectedDate,
      selectedTime: data.selectedTime,
      customer: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
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
    { number: 3, label: "Details", active: currentStep >= 3, completed: false },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="bg-johnson-blue text-white p-6 -m-6 mb-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">Book Your Service</DialogTitle>
              <p className="text-blue-100">Fast, easy scheduling in just a few steps</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:text-gray-300 hover:bg-white/10"
              data-testid="close-booking-modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="bg-gray-50 px-6 py-4 -mx-6">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {progressSteps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.completed ? 'bg-green-500 text-white' :
                  step.active ? 'bg-johnson-blue text-white' : 
                  'bg-gray-300 text-gray-500'
                }`}>
                  {step.number}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step.active ? 'text-johnson-blue' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < progressSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="step-transition-enter">
              <h4 className="text-xl font-bold text-gray-900 mb-6">What service do you need?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map((service) => {
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
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-johnson-blue bg-blue-50' 
                          : 'border-gray-200 hover:border-johnson-blue'
                      }`}
                      data-testid={`booking-service-${service.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getIconColor(service.category)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{service.name}</h5>
                            <p className="text-sm text-gray-600">{service.description.substring(0, 50)}...</p>
                          </div>
                        </div>
                        <span className="text-johnson-blue font-bold">
                          {service.basePrice === "2500.00" ? "Quote" : `$${service.basePrice}+`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!selectedService}
                  className="bg-johnson-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-johnson-teal transition-colors disabled:opacity-50"
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
              <h4 className="text-xl font-bold text-gray-900 mb-6">When would you like service?</h4>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-4">Select Date</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().slice(0, 21).map((day) => (
                        <div
                          key={day.date}
                          onClick={() => handleDateSelect(day.date)}
                          className={`text-center py-2 cursor-pointer rounded transition-colors ${
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
                  <h5 className="font-semibold text-gray-900 mb-4">Available Times</h5>
                  {selectedDate ? (
                    <div className="space-y-2">
                      {timeSlotsLoading ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500">Loading available times...</p>
                        </div>
                      ) : timeSlots && timeSlots.length > 0 ? (
                        timeSlots.map((slot) => {
                          const isSelected = selectedTimeSlot?.id === slot.id;
                          return (
                            <div
                              key={slot.id}
                              onClick={() => handleTimeSelect(slot)}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors time-slot-button ${
                                isSelected 
                                  ? 'border-johnson-blue bg-blue-50' 
                                  : 'border-gray-200 hover:border-johnson-blue'
                              }`}
                              data-testid={`time-slot-${slot.startTime}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <span className="text-sm text-green-600">Available</span>
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

              <div className="mt-8 flex justify-between">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="px-6 py-3"
                  data-testid="step2-back-button"
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!selectedDate || !selectedTimeSlot}
                  className="bg-johnson-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-johnson-teal transition-colors disabled:opacity-50"
                  data-testid="step2-continue-button"
                >
                  Continue to Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Customer Details */}
          {currentStep === 3 && (
            <div className="step-transition-enter">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Your Information</h4>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="John"
                              data-testid="booking-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Doe"
                              data-testid="booking-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="john@example.com"
                              data-testid="booking-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel"
                              placeholder="(617) 555-0123"
                              data-testid="booking-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Address *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="123 Main St, Quincy, MA 02169"
                            data-testid="booking-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="problemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                            placeholder="Please describe the plumbing issue you're experiencing..."
                            data-testid="booking-problem-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Booking Summary</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span data-testid="booking-summary-service">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span data-testid="booking-summary-datetime">
                          {selectedDate && selectedTimeSlot 
                            ? `${new Date(selectedDate).toLocaleDateString()} at ${selectedTimeSlot.startTime}`
                            : 'Not selected'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee:</span>
                        <span className="font-semibold text-johnson-blue" data-testid="booking-summary-fee">
                          ${selectedService?.basePrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="px-6 py-3"
                      data-testid="step3-back-button"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={createBookingMutation.isPending}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      data-testid="confirm-booking-button"
                    >
                      {createBookingMutation.isPending ? (
                        "Creating Booking..."
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Confirm Booking
                        </>
                      )}
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
