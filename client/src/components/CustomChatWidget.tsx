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
  card?: 'appointment' | 'quote' | 'emergency' | 'customer_lookup' | null;
  cardData?: any;
  cardIntents?: CardIntent[];
}

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
}

interface QuickAction {
  icon: typeof Wrench;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: AlertTriangle, label: "Emergency", prompt: "I have a plumbing emergency!" },
  { icon: Calendar, label: "Book Now", prompt: "I'd like to schedule an appointment" },
  { icon: Wrench, label: "Get Quote", prompt: "Can I get a price quote?" },
  { icon: MessageSquare, label: "Services", prompt: "What services do you offer?" },
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

function QuoteCard({ data }: { data: any }) {
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
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
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
          <p className="text-red-600 dark:text-red-400 text-xs font-medium">Emergency Service</p>
          <h2 className="mt-0.5 text-sm font-semibold text-red-700 dark:text-red-300">24/7 Available</h2>
        </div>
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs">Urgent</Badge>
      </div>
      <div className="mt-2 space-y-1 text-xs">
        <p className="text-red-700 dark:text-red-300 font-medium">Immediate Steps:</p>
        <ul className="list-disc list-inside text-red-600 dark:text-red-400 space-y-0.5">
          <li>Turn off water supply</li>
          <li>Move valuables from water</li>
          <li>Call us immediately</li>
        </ul>
      </div>
      <div className="mt-3 border-t border-red-300 dark:border-red-800 pt-3">
        <a href="tel:6174799911" className="block">
          <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-xs h-8">
            <Phone className="w-3 h-3 mr-1" />
            Call (617) 479-9911
          </Button>
        </a>
      </div>
    </div>
  );
}

interface CustomerLookupCardProps {
  onSearch: (query: string) => void;
  onSelectCustomer: (customer: CustomerResult) => void;
  onNewCustomer: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
  results?: CustomerResult[];
  searchValue?: string;
}

function CustomerLookupCard({
  onSearch,
  onSelectCustomer,
  onNewCustomer,
  onDismiss,
  isLoading,
  results,
  searchValue: initialSearchValue,
}: CustomerLookupCardProps) {
  const [searchValue, setSearchValue] = useState(initialSearchValue || '');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const handleSelect = (customer: CustomerResult) => {
    setSelectedId(customer.id);
    onSelectCustomer(customer);
  };

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
          Enter your phone or email to find your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Phone or email..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isLoading || !searchValue.trim()}
            className="h-9"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
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
    if (toolsUsed?.includes('get_quote')) return { cardType: 'quote' };
    if (toolsUsed?.includes('emergency_help')) return { cardType: 'emergency' };
    if (toolsUsed?.includes('lookup_customer')) {
      setShowCustomerLookup(true);
      return { cardType: 'customer_lookup' };
    }
    if (content.toLowerCase().includes('emergency') && content.toLowerCase().includes('call')) return { cardType: 'emergency' };
    
    const { cards } = extractCardIntents(content);
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

  const handleCustomerSearch = useCallback(async (query: string) => {
    setIsSearchingCustomer(true);
    setCustomerSearchResults(undefined);
    
    try {
      const response = await fetch(`/api/v1/customers/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
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
        address: c.address || c.streetAddress || '',
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
    sendMessageRef.current?.(`I'm ${customer.firstName} ${customer.lastName}, phone: ${customer.phone}`);
  }, []);

  const handleNewCustomer = useCallback(() => {
    setShowCustomerLookup(false);
    setCustomerSearchResults(undefined);
    sendMessageRef.current?.("I'm a new customer");
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
            className="fixed bottom-36 md:bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
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

                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(action.prompt)}
                        className="group relative overflow-hidden rounded-lg p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        data-testid={`quick-action-${index}`}
                      >
                        <div className="flex items-center gap-2">
                          <action.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-sm text-slate-900 dark:text-white">{action.label}</span>
                        </div>
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
                        {message.card === 'quote' && <QuoteCard data={message.cardData} />}
                        {message.card === 'emergency' && <EmergencyCard />}
                        {message.card === 'customer_lookup' && showCustomerLookup && (
                          <CustomerLookupCard
                            onSearch={handleCustomerSearch}
                            onSelectCustomer={handleSelectCustomer}
                            onNewCustomer={handleNewCustomer}
                            onDismiss={() => setShowCustomerLookup(false)}
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

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-center gap-1">
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
