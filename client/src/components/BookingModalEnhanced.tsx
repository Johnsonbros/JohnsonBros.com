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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { z } from "zod";
import { formatTimeSlotWindow, isWeekendDate } from "@/lib/timeUtils";
import { PricingEstimate } from "./PricingEstimate";
import { AddressAutocomplete } from "./AddressAutocomplete";

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

const newCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Service address is required"),
});

const returningCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

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
    selectedService: {
      id: 'service-call',
      name: 'Service Call',
      description: 'Professional plumbing assessment',
      price: 99,
      category: 'maintenance'
    },
    selectedAddOns: [],
    problemDetails: {
      description: "",
      commonIssues: [],
      severity: "moderate",
      duration: "unknown",
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
      base: 99,
      additionalFees: 0,
      addOnsTotal: 0,
      total: 99,
    },
  });
  const [customerType, setCustomerType] = useState<"new" | "returning">("returning");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [smsError, setSmsError] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const steps = [
    { id: 1, name: "Schedule", icon: Calendar },
    { id: 2, name: "Identity", icon: User },
    { id: 3, name: "Verification", icon: Shield },
    { id: 4, name: "Confirm", icon: CheckCircle },
  ];

  const newCustomerForm = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", address: "" },
  });

  const returningCustomerForm = useForm<ReturningCustomerFormValues>({
    resolver: zodResolver(returningCustomerSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });

  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ["/api/v1/timeslots", bookingData.selectedDate],
    queryFn: () => getTimeSlots(bookingData.selectedDate),
    enabled: !!bookingData.selectedDate,
  });

  const lookupCustomerMutation = useMutation({
    mutationFn: lookupCustomer,
    onSuccess: (data: any) => {
      if (data.customers && data.customers.length > 0) {
        const c = data.customers[0];
        setBookingData(prev => ({
          ...prev,
          customer: {
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            address: c.addresses?.[0]?.street || ""
          }
        }));
        setSelectedAddressIndex(0);
        toast({ title: "Profile Found", description: "Successfully loaded your account." });
      } else {
        toast({ title: "Not Found", description: "No profile found. Try 'New Customer' tab.", variant: "destructive" });
      }
    }
  });

  const startSmsVerificationMutation = useMutation({
    mutationFn: startSmsVerification,
    onSuccess: () => {
      setBookingData(prev => ({
        ...prev,
        smsVerification: { ...prev.smsVerification, status: "pending", phone: bookingData.customer?.phone || "" }
      }));
      toast({ title: "Code Sent", description: "Please check your phone." });
    }
  });

  const confirmSmsVerificationMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => confirmSmsVerification(phone, code),
    onSuccess: () => {
      setBookingData(prev => ({
        ...prev,
        smsVerification: { ...prev.smsVerification, status: "verified" }
      }));
      toast({ title: "Verified", description: "Identity confirmed." });
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast({ title: "Booked!", description: "Your appointment is confirmed." });
      onClose();
    }
  });

  const generateWeekDays = () => {
    const weekdays = [];
    const start = new Date();
    start.setDate(start.getDate() + (weekOffset * 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      weekdays.push({
        date: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isPast: d < new Date(new Date().setHours(0,0,0,0))
      });
    }
    return { weekdays };
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !bookingData.selectedTimeSlot) {
      toast({ title: "Selection Required", description: "Please pick a time slot.", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && (!bookingData.customer || !bookingData.customer.address)) {
      toast({ title: "Profile & Address Required", description: "Please identify yourself and ensure a service address is set.", variant: "destructive" });
      return;
    }
    if (currentStep === 3 && bookingData.smsVerification.status !== "verified") {
      toast({ title: "Verification Required", description: "Please verify your phone number.", variant: "destructive" });
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <MobileDialogContent fullScreen={isMobile} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 pt-2 text-center">
          <img src="/JB_logo_New_1756136293648.png" alt="Logo" className="h-12 mx-auto mb-4" />
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <div className="flex justify-between mt-2 px-2">
            {steps.map(s => <div key={s.id} className={`text-[10px] font-bold ${currentStep >= s.id ? 'text-johnson-blue' : 'text-gray-400'}`}>{s.name}</div>)}
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-johnson-blue">1. Select Date & Window</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="bg-green-600 text-white p-2 rounded-full">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-green-800">Guaranteed Availability</div>
                <div className="text-xs text-green-700">Pick a slot below to lock it in. We'll verify your details next.</div>
              </div>
            </div>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <Button variant={weekOffset === 0 ? "secondary" : "ghost"} size="sm" className="flex-1" onClick={() => setWeekOffset(0)}>This Week</Button>
              <Button variant={weekOffset === 1 ? "secondary" : "ghost"} size="sm" className="flex-1" onClick={() => setWeekOffset(1)}>Next Week</Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateWeekDays().weekdays.map(d => (
                <button key={d.date} disabled={d.isPast} onClick={() => setBookingData(prev => ({ ...prev, selectedDate: d.date, selectedTimeSlot: null }))}
                  className={`p-2 rounded-lg text-center transition-all border ${bookingData.selectedDate === d.date ? 'bg-johnson-blue text-white' : 'bg-white hover:bg-gray-50'}`}>
                  <div className="text-[10px] opacity-70 uppercase">{d.dayName}</div>
                  <div className="font-bold">{d.dayNum}</div>
                </button>
              ))}
            </div>
            {bookingData.selectedDate && (
              <div className="grid grid-cols-1 gap-2">
                {timeSlotsLoading ? <div className="text-center py-4 animate-pulse">Loading windows...</div> : 
                  timeSlots?.map((s: any, idx: number) => {
                    const timeLabels = ['Morning', 'Midday', 'Afternoon'];
                    const timeIcons = ['🌅', '☀️', '🌆'];
                    return (
                      <button key={s.id} onClick={() => setBookingData(prev => ({ ...prev, selectedTimeSlot: s }))}
                        className={`p-4 rounded-xl border-2 text-left flex justify-between items-center relative ${bookingData.selectedTimeSlot?.id === s.id ? 'border-johnson-blue bg-blue-50' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{timeIcons[idx] || '⏰'}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="text-[10px] font-bold text-gray-500 uppercase">{timeLabels[idx] || 'Window'}</div>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-tighter">Available</span>
                            </div>
                            <div className="font-bold">{formatTimeSlotWindow(s.startTime, s.endTime)}</div>
                          </div>
                        </div>
                        {bookingData.selectedTimeSlot?.id === s.id && <CheckCircle className="text-johnson-blue" />}
                      </button>
                    );
                  })}
              </div>
            )}
            <Textarea placeholder="Notes for the technician (optional)..." value={problemDescription} onChange={e => setProblemDescription(e.target.value)} />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button className="bg-johnson-blue" onClick={handleNextStep} disabled={!bookingData.selectedTimeSlot}>Continue to Profile <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {bookingData.selectedDate && bookingData.selectedTimeSlot && (
              <div className="bg-johnson-blue/5 border border-johnson-blue/20 rounded-xl p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-johnson-blue text-white p-2 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-johnson-blue/60 tracking-wider">Your Selection</div>
                    <div className="text-sm font-bold text-johnson-blue">
                      {new Date(bookingData.selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {formatTimeSlotWindow(bookingData.selectedTimeSlot.startTime, bookingData.selectedTimeSlot.endTime)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-johnson-blue hover:bg-johnson-blue/10 font-bold text-xs h-8" onClick={() => setCurrentStep(1)}>Change</Button>
              </div>
            )}
            <h3 className="font-bold text-lg">2. Identity & Profile</h3>
            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 border border-blue-100">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-800 font-medium">Secure & Encrypted Lookup</span>
            </div>
            <Tabs defaultValue="returning" onValueChange={(v) => setCustomerType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">New Customer</TabsTrigger>
                <TabsTrigger value="returning">Returning Customer</TabsTrigger>
              </TabsList>
              <TabsContent value="returning" className="pt-4 space-y-4">
                <Input placeholder="First Name" value={returningCustomerForm.watch("firstName")} onChange={e => returningCustomerForm.setValue("firstName", e.target.value)} />
                <Input placeholder="Last Name" value={returningCustomerForm.watch("lastName")} onChange={e => returningCustomerForm.setValue("lastName", e.target.value)} />
                <Input placeholder="Phone" value={returningCustomerForm.watch("phone")} onChange={e => returningCustomerForm.setValue("phone", e.target.value)} />
                <Button className="w-full" onClick={() => lookupCustomerMutation.mutate(returningCustomerForm.getValues())}>
                  {lookupCustomerMutation.isPending ? "Searching..." : "Look up Profile"}
                </Button>
              </TabsContent>
              <TabsContent value="new" className="pt-4 space-y-4">
                <Input placeholder="First Name" {...newCustomerForm.register("firstName")} />
                <Input placeholder="Last Name" {...newCustomerForm.register("lastName")} />
                <AddressAutocomplete 
                  value={newCustomerForm.watch("address") || ""}
                  onChange={(addr: string) => {
                    newCustomerForm.setValue("address", addr);
                    setBookingData(prev => ({ ...prev, customer: { firstName: newCustomerForm.getValues().firstName, lastName: newCustomerForm.getValues().lastName, phone: newCustomerForm.getValues().phone, id: 'new', address: addr, email: "" } }));
                  }} 
                />
              </TabsContent>
            </Tabs>
            {bookingData.customer && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-1"><CheckCircle className="w-4 h-4" /> Profile Active</div>
                <div className="text-xs text-green-700 font-medium mb-2">{bookingData.customer.firstName} {bookingData.customer.lastName} • {bookingData.customer.phone}</div>
                {lookupCustomerMutation.data?.customers?.[0]?.addresses?.length > 1 && (
                  <div className="mt-2 space-y-2">
                    <Label className="text-[10px] uppercase text-green-700 font-bold">Select Service Address</Label>
                    <Select value={selectedAddressIndex?.toString()} onValueChange={(val) => {
                      const idx = parseInt(val);
                      setSelectedAddressIndex(idx);
                      const addr = lookupCustomerMutation.data.customers[0].addresses[idx];
                      setBookingData(prev => ({ ...prev, customer: { ...prev.customer!, address: addr.street } }));
                    }}>
                      <SelectTrigger className="bg-white border-green-200 text-xs h-8"><SelectValue placeholder="Pick an address" /></SelectTrigger>
                      <SelectContent>{lookupCustomerMutation.data.customers[0].addresses.map((addr: any, idx: number) => (<SelectItem key={idx} value={idx.toString()}>{addr.street}, {addr.city}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
                {!lookupCustomerMutation.data?.customers?.[0]?.addresses?.length && customerType === "returning" && (
                   <div className="mt-2">
                     <Label className="text-[10px] uppercase text-green-700 font-bold">No address on file. Please enter one:</Label>
                     <AddressAutocomplete 
                       value={bookingData.customer.address || ""}
                       onChange={(addr: string) => setBookingData(prev => ({ ...prev, customer: { ...prev.customer!, address: addr } }))} 
                     />
                   </div>
                )}
                {lookupCustomerMutation.data?.customers?.[0]?.addresses?.length === 1 && (
                  <div className="text-[10px] text-green-600 italic mt-1">Service Address: {bookingData.customer.address}</div>
                )}
              </div>
            )}
            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={handlePreviousStep}>Back</Button>
              <Button className="bg-johnson-blue" onClick={handleNextStep} disabled={!bookingData.customer}>Continue to Verification <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto"><Shield className="text-johnson-blue" /></div>
              <h3 className="font-bold text-xl">3. Verification</h3>
              <p className="text-xs text-gray-500">Security gate: confirming your identity via text</p>
            </div>
            {bookingData.smsVerification.status !== "verified" ? (
              <div className="space-y-4">
                <Button className="w-full bg-johnson-blue h-12 text-lg font-bold" onClick={() => startSmsVerificationMutation.mutate(bookingData.customer?.phone || "")} disabled={startSmsVerificationMutation.isPending}>
                  {startSmsVerificationMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
                {bookingData.smsVerification.status === "pending" && (
                  <div className="space-y-4 text-center">
                    <InputOTP maxLength={6} value={smsCode} onChange={setSmsCode} onComplete={(code) => confirmSmsVerificationMutation.mutate({ phone: bookingData.customer?.phone || "", code })}>
                      <InputOTPGroup><InputOTPSlot index={0}/><InputOTPSlot index={1}/><InputOTPSlot index={2}/><InputOTPSlot index={3}/><InputOTPSlot index={4}/><InputOTPSlot index={5}/></InputOTPGroup>
                    </InputOTP>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-200 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
                <div className="font-bold text-green-800">Human Verified</div>
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePreviousStep}>Back</Button>
              <Button className="bg-johnson-blue" onClick={handleNextStep} disabled={bookingData.smsVerification.status !== "verified"}>Review Booking <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="font-bold text-xl text-center text-johnson-blue uppercase">4. Confirmation</h3>
            <div className="space-y-4 border rounded-2xl p-4 bg-gray-50/50">
              <div className="flex justify-between items-start"><div className="text-sm font-bold text-gray-500 uppercase">Service</div><div className="font-bold">Service Call</div></div>
              <div className="flex justify-between items-start"><div className="text-sm font-bold text-gray-500 uppercase">Date</div><div className="font-bold">{bookingData.selectedDate}</div></div>
              <div className="flex justify-between items-start"><div className="text-sm font-bold text-gray-500 uppercase">Window</div><div className="font-bold">{bookingData.selectedTimeSlot ? formatTimeSlotWindow(bookingData.selectedTimeSlot.startTime, bookingData.selectedTimeSlot.endTime) : ''}</div></div>
              <div className="flex justify-between items-start pt-2 border-t"><div className="text-sm font-bold text-gray-500 uppercase">Total</div><div className="text-xl font-black text-johnson-blue">$99.00</div></div>
            </div>
            <Button className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg font-black" onClick={() => createBookingMutation.mutate({
              customerInfo: { ...bookingData.customer!, city: "Quincy", state: "MA", zipCode: "02169" },
              selectedService: bookingData.selectedService,
              selectedDate: bookingData.selectedDate,
              selectedTime: bookingData.selectedTimeSlot!.startTime,
              problemDescription: problemDescription || "Standard Service Call"
            } as any)} disabled={createBookingMutation.isPending}>
              {createBookingMutation.isPending ? "Finalizing..." : "Confirm & Schedule Appointment"}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={handlePreviousStep}>Back to edit</Button>
          </div>
        )}
      </MobileDialogContent>
    </Dialog>
  );
}
