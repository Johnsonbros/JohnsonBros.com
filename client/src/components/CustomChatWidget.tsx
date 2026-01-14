import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  X,
  Phone,
  Wrench, 
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Calendar,
  MapPin,
  AlertTriangle,
  Search,
  User,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';
import { extractCardIntents, type CardIntent, type ReturningCustomerLookupCard as ReturningCustomerLookupCardType } from '@/lib/cardProtocol';

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;
const MotionSpan = motion.span as React.FC<HTMLMotionProps<'span'> & React.HTMLAttributes<HTMLSpanElement>>;
const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & React.ButtonHTMLAttributes<HTMLButtonElement>>;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative' | null;
  card?: 'appointment' | 'quote' | 'emergency' | 'customer_lookup' | 'lead' | 'new_customer' | null;
  cardData?: any;
  cardIntents?: CardIntent[];
}

interface CustomerAddress {
  id: string;
  street: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  addresses?: CustomerAddress[];
  selectedAddressId?: string;
}

interface QuickAction {
  icon: typeof Wrench;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: AlertTriangle, label: "I have an emergency issue, can you help?", prompt: "I have an emergency issue, can you help?" },
  { icon: Wrench, label: "I'm looking to get a quote for some work.", prompt: "I'm looking to get a quote for some work." },
  { icon: Calendar, label: "Can I book an appointment?", prompt: "Can I book an appointment?" },
  { icon: MessageSquare, label: "What types of services do you offer?", prompt: "What types of services do you offer?" },
];

function AppointmentCard({ data }: { data: any }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md p-3 mt-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Appointment Confirmed</p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">Johnson Bros. Plumbing</h2>
        </div>
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">Confirmed</Badge>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
        <dt className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
          <Calendar className="size-3" />
          Date
        </dt>
        <dd className="text-right text-slate-900 dark:text-white">{data?.date || 'Tomorrow · 9:00 AM'}</dd>
        <dt className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
          <Wrench className="size-3" />
          Service
        </dt>
        <dd className="text-right text-slate-900 dark:text-white">{data?.service || 'General Plumbing'}</dd>
        <dt className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
          <MapPin className="size-3" />
          Address
        </dt>
        <dd className="text-right truncate text-slate-900 dark:text-white">{data?.address || 'Your address'}</dd>
      </dl>
      <div className="mt-3 grid gap-2 border-t border-slate-200 dark:border-slate-700 pt-3 grid-cols-2">
        <a href="tel:6174799911" className="block">
          <Button variant="outline" size="sm" className="w-full text-xs h-8">
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
        </a>
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
          <MapPin className="w-3 h-3 mr-1" />
          Directions
        </Button>
      </div>
    </div>
  );
}

function QuoteCard({ data, onBookNow }: { data: any; onBookNow?: () => void }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md p-3 mt-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Service Quote</p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{data?.service || 'Plumbing Service'}</h2>
        </div>
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs">Estimate</Badge>
      </div>
      <div className="mt-2 text-center py-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${data?.price || '99'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Service Call Fee</p>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
        Final price after on-site diagnosis. No hidden fees.
      </p>
      <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
        <Button 
          size="sm" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8"
          onClick={onBookNow}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Book Now
        </Button>
      </div>
    </div>
  );
}

function EmergencyCard() {
  return (
    <div className="w-full rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/30 shadow-md p-3 mt-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-red-600 dark:text-red-400 text-xs font-medium">Emergency? Call Us Now</p>
          <h2 className="mt-0.5 text-sm font-semibold text-red-700 dark:text-red-300">We're Here 24/7</h2>
        </div>
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs">Urgent</Badge>
      </div>
      <div className="mt-2 space-y-1.5 text-xs">
        <p className="text-red-700 dark:text-red-300">
          For fastest service, please call us directly. Our team is standing by to dispatch a technician immediately.
        </p>
        <p className="text-red-600 dark:text-red-400 font-medium">
          Life-threatening emergency? Call 911 first.
        </p>
      </div>
      <div className="mt-3 border-t border-red-300 dark:border-red-800 pt-3">
        <a href="tel:6174799911" className="block">
          <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-xs h-8">
            <Phone className="w-3 h-3 mr-1" />
            Call (617) 479-9911 Now
          </Button>
        </a>
      </div>
    </div>
  );
}

interface LeadFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  marketingOptIn: boolean;
  issueDescription?: string;
}

interface LeadCardProps {
  onSubmit: (data: LeadFormData) => void;
  isLoading?: boolean;
  prefill?: Partial<LeadFormData>;
}

function LeadCard({ onSubmit, isLoading, prefill }: LeadCardProps) {
  const [firstName, setFirstName] = useState(prefill?.firstName || '');
  const [lastName, setLastName] = useState(prefill?.lastName || '');
  const [phone, setPhone] = useState(prefill?.phone || '');
  const [email, setEmail] = useState(prefill?.email || '');
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return '';
  };

  const canSubmit = firstName.trim().length >= 2 && 
                    lastName.trim().length >= 2 && 
                    phone.replace(/\D/g, '').length >= 10 &&
                    email.includes('@');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\D/g, ''),
        email: email.trim(),
        marketingOptIn,
        issueDescription: prefill?.issueDescription,
      });
    }
  };

  return (
    <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900 shadow-lg mt-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          Get Your Free Quote
        </CardTitle>
        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
          Share your info and we'll get back to you with pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                <User className="w-3 h-3" />
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                <User className="w-3 h-3" />
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Phone className="w-3 h-3" />
              Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
              placeholder="(617) 555-1234"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="w-3 h-3" />
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="marketing-opt-in"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="marketing-opt-in" className="text-xs text-gray-600 dark:text-gray-400">
              I agree to receive text messages about my quote and special offers. Message & data rates may apply.
            </label>
          </div>
          <Button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Get My Quote
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface NewCustomerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface NewCustomerCardProps {
  onSubmit: (data: NewCustomerFormData) => void;
  isLoading?: boolean;
  prefill?: Partial<NewCustomerFormData>;
}

function NewCustomerCard({ onSubmit, isLoading, prefill }: NewCustomerCardProps) {
  const [firstName, setFirstName] = useState(prefill?.firstName || '');
  const [lastName, setLastName] = useState(prefill?.lastName || '');
  const [phone, setPhone] = useState(prefill?.phone || '');
  const [address, setAddress] = useState(prefill?.address || '');
  const [city, setCity] = useState(prefill?.city || '');
  const [state, setState] = useState(prefill?.state || 'MA');
  const [zip, setZip] = useState(prefill?.zip || '');

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return '';
  };

  const canSubmit = firstName.trim().length >= 2 && 
                    lastName.trim().length >= 2 && 
                    phone.replace(/\D/g, '').length >= 10 &&
                    address.trim().length >= 5 &&
                    city.trim().length >= 2 &&
                    state.length === 2 &&
                    zip.replace(/\D/g, '').length >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\D/g, ''),
        address: address.trim(),
        city: city.trim(),
        state: state.toUpperCase(),
        zip: zip.replace(/\D/g, '').slice(0, 5),
      });
    }
  };

  return (
    <Card className="w-full border-green-200 bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-slate-900 shadow-lg mt-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
          New Customer Information
        </CardTitle>
        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
          Please fill in your details to continue booking
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                <User className="w-3 h-3" />
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Phone className="w-3 h-3" />
              Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
              placeholder="(617) 555-1234"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <MapPin className="w-3 h-3" />
              Service Address
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street"
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-3 space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">City</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Quincy"
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">State</label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="MA"
                className="h-8 text-sm"
                maxLength={2}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">ZIP</label>
              <Input
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="02169"
                className="h-8 text-sm"
                maxLength={5}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Continue to Booking
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface CustomerLookupSearch {
  firstName: string;
  lastName: string;
  phone: string;
}

interface CustomerLookupCardProps {
  onSearch: (search: CustomerLookupSearch) => void;
  onSelectCustomer: (customer: CustomerResult) => void;
  onNewCustomer: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
  results?: CustomerResult[];
}

function CustomerLookupCard({
  onSearch,
  onSelectCustomer,
  onNewCustomer,
  onDismiss,
  isLoading,
  results,
}: CustomerLookupCardProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'select_address' | 'verify' | 'call_fallback'>('search');
  const [foundCustomer, setFoundCustomer] = useState<CustomerResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [sendRetryCount, setSendRetryCount] = useState(0);
  const MAX_SEND_RETRIES = 2;

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return '';
  };

  const canSearch = firstName.trim().length >= 2 && lastName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSearch) {
      onSearch({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\D/g, ''),
      });
    }
  };

  const logVerificationFailure = async (failureType: string, errorMessage: string, attemptNumber: number) => {
    try {
      await fetch('/api/v1/sms-verification/log-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: foundCustomer?.phone || phone,
          failureType,
          errorMessage,
          attemptNumber,
          customerName: foundCustomer ? `${foundCustomer.firstName} ${foundCustomer.lastName}` : `${firstName} ${lastName}`,
        }),
      });
    } catch (e) {
      console.error('Failed to log verification failure:', e);
    }
  };

  const sendVerificationCode = async (customer: CustomerResult, isRetry = false) => {
    const currentAttempt = isRetry ? sendRetryCount + 1 : 1;
    if (!isRetry) setSendRetryCount(0);
    
    setIsSendingCode(true);
    setVerificationError('');
    
    try {
      const response = await fetch('/api/v1/sms-verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send code');
      }
      
      if (isRetry) setSendRetryCount(currentAttempt);
      setVerificationError('');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send verification code';
      
      if (currentAttempt >= MAX_SEND_RETRIES) {
        await logVerificationFailure('max_retries_exceeded', errorMsg, currentAttempt);
        setStep('call_fallback');
      } else {
        await logVerificationFailure('send_failed', errorMsg, currentAttempt);
        setSendRetryCount(currentAttempt);
        setVerificationError(`Failed to send code. ${MAX_SEND_RETRIES - currentAttempt} retry${MAX_SEND_RETRIES - currentAttempt !== 1 ? 's' : ''} remaining.`);
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!foundCustomer || sendRetryCount >= MAX_SEND_RETRIES) {
      setStep('call_fallback');
      return;
    }
    await sendVerificationCode(foundCustomer, true);
  };

  const handleSelectAddress = async (customer: CustomerResult, addressId: string, addressStr: string) => {
    setSelectedId(addressId);
    setFoundCustomer({ ...customer, selectedAddressId: addressId, address: addressStr });
    setStep('verify');
    await sendVerificationCode(customer, false);
  };

  const handleVerify = async () => {
    if (!foundCustomer || verificationCode.length !== 6) return;
    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await fetch('/api/v1/sms-verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: foundCustomer.phone, code: verificationCode }),
      });
      const data = await response.json();
      if (data.success) {
        onSelectCustomer(foundCustomer);
      } else {
        await logVerificationFailure('verify_failed', data.error || 'Invalid code', 1);
        setVerificationError(data.error || 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      await logVerificationFailure('verify_failed', err.message || 'Verification failed', 1);
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelect = (customer: CustomerResult) => {
    if (customer.addresses && customer.addresses.length > 0) {
      setFoundCustomer(customer);
      setStep('select_address');
    } else {
      setSelectedId(customer.id);
      onSelectCustomer(customer);
    }
  };

  if (step === 'call_fallback') {
    return (
      <Card className="w-full border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/30 dark:from-slate-800 dark:to-slate-900 shadow-lg mt-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            Let's Schedule Over the Phone
          </CardTitle>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
            We're having trouble sending the verification code. Please give us a quick call and we'll get you scheduled right away!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Johnson Bros. Plumbing</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">(617) 479-9911</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mon-Fri: 8AM-5PM | Emergencies: 24/7</p>
          </div>
          <a href="tel:6174799911" className="block">
            <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700">
              <Phone className="w-4 h-4 mr-2" />
              Call Now to Schedule
            </Button>
          </a>
          <Button variant="ghost" size="sm" onClick={() => { setSendRetryCount(0); setStep('select_address'); }} className="w-full text-xs">
            Try again with a different address
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify' && foundCustomer) {
    return (
      <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900 shadow-lg mt-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            Verify Your Phone
          </CardTitle>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
            We sent a 6-digit code to {foundCustomer.phone}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Input
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className="h-10 text-center text-lg tracking-widest font-mono"
            maxLength={6}
          />
          {verificationError && (
            <div className="space-y-2">
              <p className="text-xs text-red-500">{verificationError}</p>
              {sendRetryCount < MAX_SEND_RETRIES && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="w-full text-xs h-8"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Resend Code ({MAX_SEND_RETRIES - sendRetryCount} attempt{MAX_SEND_RETRIES - sendRetryCount !== 1 ? 's' : ''} left)
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || isSendingCode || verificationCode.length !== 6}
            className="w-full h-9"
          >
            {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStep('select_address')} className="w-full text-xs">
            Back to address selection
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'select_address' && foundCustomer && foundCustomer.addresses) {
    return (
      <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900 shadow-lg mt-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            Select Service Address
          </CardTitle>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
            Hi {foundCustomer.firstName}! Which address do you need service at?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {foundCustomer.addresses.map((addr: any) => (
            <Button
              key={addr.id}
              variant={selectedId === addr.id ? 'default' : 'outline'}
              className="w-full justify-start text-left h-auto py-2.5 px-3"
              onClick={() => handleSelectAddress(foundCustomer, addr.id, addr.street)}
            >
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{addr.street}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''} {addr.zip || ''}</span>
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setStep('search')} className="w-full text-xs mt-2">
            Not me? Search again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900 shadow-lg mt-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          Look Up Your Account
        </CardTitle>
        <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
          Enter your name and phone number to find your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 ml-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500 uppercase">First Name</span>
              </div>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 ml-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500 uppercase">Last Name</span>
              </div>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 ml-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-500 uppercase">Phone Number</span>
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
              placeholder="Phone number"
              className="h-9 text-sm"
              type="tel"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isLoading || !canSearch}
            className="w-full h-9"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Search className="w-3.5 h-3.5 mr-2" />}
            {isLoading ? 'Searching...' : 'Find My Account'}
          </Button>
        </form>

        {results && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
              Found {results.length} customer{results.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all text-sm ${
                    selectedId === customer.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {customer.firstName} {customer.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {customer.address}
                        </div>
                      )}
                    </div>
                    {selectedId === customer.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="text-center py-3">
            <p className="text-xs text-gray-500 mb-2">No customers found</p>
            <Button
              onClick={onNewCustomer}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs h-8"
            >
              <User className="w-3 h-3 mr-1.5" />
              I'm a new customer
            </Button>
          </div>
        )}

        {!results && (
          <div className="text-center py-1">
            <Button
              onClick={onNewCustomer}
              variant="link"
              size="sm"
              className="text-blue-600 text-xs"
            >
              I'm a new customer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CustomChatWidgetProps {
  className?: string;
}

export function CustomChatWidget({ className }: CustomChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerResult[] | undefined>(undefined);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [showLeadCard, setShowLeadCard] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadCardPrefill, setLeadCardPrefill] = useState<Partial<LeadFormData>>({});
  const [showNewCustomerCard, setShowNewCustomerCard] = useState(false);
  const [isSubmittingNewCustomer, setIsSubmittingNewCustomer] = useState(false);
  const [newCustomerPrefill, setNewCustomerPrefill] = useState<Partial<NewCustomerFormData>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / 300, 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const detectCardType = (content: string, toolsUsed?: string[]): { cardType: Message['card']; cardIntent?: CardIntent } => {
    if (toolsUsed?.includes('book_service_call')) return { cardType: 'appointment' };
    if (toolsUsed?.includes('emergency_help')) return { cardType: 'emergency' };
    if (toolsUsed?.includes('lookup_customer')) {
      setShowCustomerLookup(true);
      return { cardType: 'customer_lookup' };
    }
    
    const { cards } = extractCardIntents(content);
    
    // Check for lead_card intent first
    const leadCardIntent = cards.find(intent => intent.type === 'lead_card');
    if (leadCardIntent) {
      setShowLeadCard(true);
      if (leadCardIntent.type === 'lead_card' && leadCardIntent.prefill) {
        setLeadCardPrefill({
          issueDescription: (leadCardIntent.prefill as any)?.issueDescription || '',
        });
      }
      return { cardType: 'lead', cardIntent: leadCardIntent };
    }
    
    // For get_quote, show lead card instead of quote card (capture info first)
    if (toolsUsed?.includes('get_quote')) {
      setShowLeadCard(true);
      return { cardType: 'lead' };
    }
    
    const customerLookupIntent = cards.find(
      intent => intent.type === 'returning_customer_lookup'
    );
    if (customerLookupIntent) {
      setShowCustomerLookup(true);
      if (customerLookupIntent.type === 'returning_customer_lookup' && customerLookupIntent.results) {
        setCustomerSearchResults(customerLookupIntent.results as CustomerResult[]);
      }
      return { cardType: 'customer_lookup', cardIntent: customerLookupIntent };
    }
    
    // Check for new_customer_info card (AI may output as new_customer_info or new_customer_information)
    const newCustomerIntent = cards.find(
      intent => intent.type === 'new_customer_info'
    );
    if (newCustomerIntent) {
      setShowNewCustomerCard(true);
      if (newCustomerIntent.prefill) {
        const prefill = newCustomerIntent.prefill as any;
        setNewCustomerPrefill({
          firstName: prefill?.firstName || '',
          lastName: prefill?.lastName || '',
          phone: prefill?.phone || '',
          address: prefill?.line1 || prefill?.address || '',
          city: prefill?.city || '',
          state: prefill?.state || 'MA',
          zip: prefill?.zip || '',
        });
      }
      return { cardType: 'new_customer', cardIntent: newCustomerIntent };
    }
    
    const lowerContent = content.toLowerCase();
    // Trigger customer lookup card when AI asks for customer identification
    const askingForLookup = (
      // Traditional phone/email lookup prompts - expanded patterns
      ((lowerContent.includes('phone') || lowerContent.includes('email')) &&
       (lowerContent.includes('look up') || lowerContent.includes('find your') || 
        lowerContent.includes('enter your') || lowerContent.includes('provide') ||
        lowerContent.includes('what is your') || lowerContent.includes("what's your") ||
        lowerContent.includes('need your') || lowerContent.includes('retrieve your') ||
        lowerContent.includes('i just need'))) ||
      // Name/address lookup prompts
      ((lowerContent.includes('name') || lowerContent.includes('address')) &&
       (lowerContent.includes('look up') || lowerContent.includes('find your') ||
        lowerContent.includes('verify') || lowerContent.includes('confirm') ||
        lowerContent.includes('retrieve'))) ||
      // Direct account lookup prompts
      (lowerContent.includes('look up your account') || 
       lowerContent.includes('find your account') ||
       lowerContent.includes('used us before') || 
       lowerContent.includes('returning customer') ||
       lowerContent.includes('retrieve your details'))
    );
    if (askingForLookup) {
      setShowCustomerLookup(true);
      return { cardType: 'customer_lookup' };
    }
    
    return { cardType: null };
  };

  const extractCardData = (content: string, cardType: Message['card'], toolResults?: any[]): any => {
    if (!cardType) return null;
    
    if (cardType === 'appointment' && toolResults) {
      const bookingResult = toolResults.find((r: any) => r.tool === 'book_service_call');
      if (bookingResult?.result) {
        return {
          date: bookingResult.result.scheduledDate || 'Tomorrow · 9:00 AM',
          service: bookingResult.result.serviceName || 'General Plumbing',
          address: bookingResult.result.address || 'Your address',
          confirmationNumber: bookingResult.result.jobId,
        };
      }
    }
    
    if (cardType === 'quote') {
      const priceMatch = content.match(/\$(\d+)/);
      const serviceMatch = content.match(/(drain cleaning|water heater|pipe repair|emergency|plumbing)/i);
      return {
        price: priceMatch ? priceMatch[1] : '99',
        service: serviceMatch ? serviceMatch[0] : 'Plumbing Service',
      };
    }
    
    return null;
  };

  const handleCustomerSearch = useCallback(async (search: CustomerLookupSearch) => {
    setIsSearchingCustomer(true);
    setCustomerSearchResults(undefined);
    
    try {
      const response = await fetch('/api/v1/customers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: search.firstName,
          lastName: search.lastName,
          phone: search.phone,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      const results: CustomerResult[] = (data.customers || []).map((c: any) => ({
        id: c.id?.toString() || c.housecallProId || '',
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        phone: c.phone || c.mobileNumber || '',
        email: c.email || '',
        addresses: (c.addresses || []).map((addr: any) => ({
          id: addr.id || '',
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          zip: addr.zip || '',
        })),
      }));
      
      setCustomerSearchResults(results);
    } catch (error) {
      console.error('Customer search error:', error);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, []);

  const sendMessageRef = useRef<((msg: string) => void) | null>(null);

  const handleSelectCustomer = useCallback((customer: CustomerResult) => {
    setShowCustomerLookup(false);
    setCustomerSearchResults(undefined);
    const addressInfo = customer.address ? `, address: ${customer.address}` : '';
    sendMessageRef.current?.(`I'm ${customer.firstName} ${customer.lastName}, phone: ${customer.phone}${addressInfo}. My account has been verified.`);
  }, []);

  const handleNewCustomer = useCallback(() => {
    setShowCustomerLookup(false);
    setCustomerSearchResults(undefined);
    sendMessageRef.current?.("I'm a new customer");
  }, []);

  const handleLeadSubmit = useCallback(async (data: LeadFormData) => {
    setIsSubmittingLead(true);
    
    try {
      // Call existing leads API with the expected structure
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customer: {
            first_name: data.firstName,
            last_name: data.lastName,
            mobile_number: data.phone,
            email: data.email,
            notifications_enabled: data.marketingOptIn,
            sms_consent: data.marketingOptIn,
            address: 'To be confirmed via chat',
            notes: data.issueDescription || 'Quote request via chat widget',
            lead_source: 'Chat Widget',
            tags: ['Chat Lead', 'Quote Request'],
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit lead');
      }
      
      const result = await response.json();
      
      // Hide the lead card and send confirmation message
      setShowLeadCard(false);
      setLeadCardPrefill({});
      
      // Send message to AI confirming lead was captured
      sendMessageRef.current?.(
        `My info: ${data.firstName} ${data.lastName}, phone: ${data.phone}, email: ${data.email}. ${data.marketingOptIn ? 'I opted in for text updates.' : ''} Please let me know about pricing and next steps.`
      );
    } catch (error) {
      console.error('Lead submission error:', error);
      // Still hide the card and notify AI about the issue
      setShowLeadCard(false);
      sendMessageRef.current?.(`I tried to submit my info but there was an issue. My name is ${data.firstName} ${data.lastName}, phone: ${data.phone}, email: ${data.email}`);
    } finally {
      setIsSubmittingLead(false);
    }
  }, []);

  const handleNewCustomerSubmit = useCallback(async (data: NewCustomerFormData) => {
    setIsSubmittingNewCustomer(true);
    
    try {
      // Hide the new customer card
      setShowNewCustomerCard(false);
      setNewCustomerPrefill({});
      
      // Format full address
      const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
      
      // Send customer info to AI to continue booking flow
      sendMessageRef.current?.(
        `I'm a new customer. My name is ${data.firstName} ${data.lastName}, phone: ${data.phone}. My service address is ${fullAddress}. Please continue with booking my appointment.`
      );
    } catch (error) {
      console.error('New customer submission error:', error);
      setShowNewCustomerCard(false);
      sendMessageRef.current?.(`I'm ${data.firstName} ${data.lastName}, phone: ${data.phone}. My address is ${data.address}, ${data.city}, ${data.state} ${data.zip}. Please help me book an appointment.`);
    } finally {
      setIsSubmittingNewCustomer(false);
    }
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const streamingMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText.trim(),
          ...(sessionId && { sessionId }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        const { cardType, cardIntent } = detectCardType(data.message, data.toolsUsed);
        const cardData = extractCardData(data.message, cardType, data.toolResults);
        
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessage.id 
            ? {
                ...msg,
                content: data.message,
                toolsUsed: data.toolsUsed,
                isStreaming: false,
                card: cardType,
                cardData,
                cardIntents: cardIntent ? [cardIntent] : undefined,
              }
            : msg
        ));
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Chat error:', error?.message || error);
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessage.id 
          ? {
              ...msg,
              content: "I'm having trouble connecting. Please call us at **(617) 479-9911** for immediate assistance.",
              isStreaming: false,
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  };

  const clearConversation = () => {
    setMessages([]);
    setSessionId(null);
  };

  const formatToolName = (tool: string): string => {
    const toolNames: Record<string, string> = {
      'lookup_customer': 'Customer lookup',
      'get_services': 'Services info',
      'get_quote': 'Price quote',
      'search_availability': 'Availability',
      'book_service_call': 'Booking',
      'emergency_help': 'Emergency info',
    };
    return toolNames[tool] || tool;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 md:bottom-24 left-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            data-testid="chat-widget-container"
          >
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Johnson Bros. Plumbing</h3>
                  <p className="text-xs text-blue-100">AI Assistant • 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                    title="Clear conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                  data-testid="chat-close-button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      How can we help?
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get instant quotes, book appointments, or emergency help
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {QUICK_ACTIONS.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(action.prompt)}
                        className="group relative overflow-hidden rounded-lg p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        data-testid={`quick-action-${index}`}
                      >
                        <span className="font-medium text-sm text-slate-900 dark:text-white">{action.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <a href="tel:6174799911" className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                      Or call <span className="font-medium">(617) 479-9911</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 mr-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Wrench className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                        {message.toolsUsed && message.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {message.toolsUsed.map((tool, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1" />
                                {formatToolName(tool)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div
                          className={`rounded-xl px-3 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                          }`}
                          data-testid={`message-${message.role}-${index}`}
                        >
                          {message.isStreaming ? (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Thinking...</span>
                            </div>
                          ) : (
                            <div className={`text-sm prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} [&>p]:mb-1 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ol]:my-1`}>
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {message.card === 'appointment' && <AppointmentCard data={message.cardData} />}
                        {message.card === 'quote' && (
                          <QuoteCard 
                            data={message.cardData} 
                            onBookNow={() => sendMessageRef.current?.("I'd like to book an appointment. I'm ready to proceed with the $99 service fee.")}
                          />
                        )}
                        {message.card === 'emergency' && <EmergencyCard />}
                        {message.card === 'lead' && (
                          <LeadCard
                            onSubmit={handleLeadSubmit}
                            isLoading={isSubmittingLead}
                            prefill={leadCardPrefill}
                          />
                        )}
                        {message.card === 'new_customer' && (
                          <NewCustomerCard
                            onSubmit={handleNewCustomerSubmit}
                            isLoading={isSubmittingNewCustomer}
                            prefill={newCustomerPrefill}
                          />
                        )}
                        {message.card === 'customer_lookup' && (
                          <CustomerLookupCard
                            onSearch={handleCustomerSearch}
                            onSelectCustomer={handleSelectCustomer}
                            onNewCustomer={handleNewCustomer}
                            onDismiss={() => {
                              setShowCustomerLookup(false);
                              setMessages(prev => prev.map(m => 
                                m.card === 'customer_lookup' ? { ...m, card: null } : m
                              ));
                            }}
                            isLoading={isSearchingCustomer}
                            results={customerSearchResults}
                          />
                        )}

                        {message.role === 'assistant' && !message.isStreaming && (
                          <div className="flex items-center gap-0.5 mt-1">
                            <button
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                            >
                              {copiedId === message.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, 'positive')}
                              className={`p-1 rounded transition-colors ${message.feedback === 'positive' ? 'text-green-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, 'negative')}
                              className={`p-1 rounded transition-colors ${message.feedback === 'negative' ? 'text-red-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full bg-blue-600 hover:bg-blue-700 h-9 w-9"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                For emergencies, call <a href="tel:6174799911" className="text-blue-500 hover:underline">(617) 479-9911</a>
              </p>
            </form>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 md:bottom-6 left-6 z-50 flex flex-col items-center gap-1">
        <AnimatePresence>
          {scrollProgress > 0.5 && !isOpen && (
            <MotionSpan
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
            >
              Chat Now
            </MotionSpan>
          )}
        </AnimatePresence>
        <MotionButton
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full bg-white hover:bg-gray-50 shadow-xl border border-gray-200 flex items-center justify-center transition-colors"
          style={{
            width: `${64 + scrollProgress * 16}px`,
            height: `${64 + scrollProgress * 16}px`,
          }}
          animate={{
            scale: isOpen ? 1 : [1, 1.05, 1],
          }}
          transition={{
            scale: {
              duration: 2,
              repeat: isOpen ? 0 : Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            },
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          data-testid="chat-toggle-button"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <MotionDiv
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-8 h-8 text-gray-700" />
              </MotionDiv>
            ) : (
              <MotionDiv
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <img 
                  src={logoIcon} 
                  alt="Chat" 
                  style={{
                    width: `${56 + scrollProgress * 16}px`,
                    height: `${56 + scrollProgress * 16}px`,
                  }}
                  className="object-contain" 
                />
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionButton>
      </div>
    </>
  );
}

export default CustomChatWidget;
