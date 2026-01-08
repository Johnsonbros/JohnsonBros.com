import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  Brain, 
  Shield, 
  Zap,
  Building,
  Home,
  Headphones,
  Code,
  ArrowRight,
  ChevronRight,
  Play,
  Calendar,
  Phone,
  Globe,
  Mic,
  Smartphone,
  Users,
  TrendingUp,
  Lock,
  Activity,
  ExternalLink,
  Cpu,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";

// AI Platform Icons Component
const AIIcon = ({ platform }: { platform: string }) => {
  const icons: { [key: string]: JSX.Element } = {
    chatgpt: <span className="text-2xl">🤖</span>,
    claude: <span className="text-2xl">🧠</span>,
    gemini: <span className="text-2xl">✨</span>,
    alexa: <span className="text-2xl">🎵</span>,
    siri: <span className="text-2xl">🍎</span>,
    assistant: <span className="text-2xl">📱</span>,
  };
  return icons[platform] || <Bot className="h-6 w-6" />;
};

type ChatCard = {
  title: string;
  description: string;
  action: string;
  icon: JSX.Element;
};

type ChatMessage = {
  role: string;
  content: string;
  typing?: boolean;
  cards?: ChatCard[];
};

// Animated Chat Simulator Component
const ChatSimulator = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentScenario, setCurrentScenario] = useState(0);
  
  const scenarios = [
    {
      name: "Emergency Leak",
      messages: [
        { role: "user", content: "I have water leaking from under my kitchen sink! Can you help me book Johnson Bros Plumbing?" },
        { role: "assistant", content: "I can help you book Johnson Bros Plumbing right away! Let me check their emergency availability..." },
        { 
          role: "assistant", 
          content: "To speed things up, tap a card to fill key details:",
          cards: [
            { title: "Service Type", description: "Emergency leak repair", action: "Add service", icon: <Zap className="h-4 w-4" /> },
            { title: "Service Address", description: "Enter location", action: "Add address", icon: <Home className="h-4 w-4" /> },
            { title: "Preferred Window", description: "Today, 2–5 PM", action: "Add time", icon: <Calendar className="h-4 w-4" /> },
            { title: "Contact Info", description: "Phone + email", action: "Add contact", icon: <Phone className="h-4 w-4" /> }
          ]
        },
        { role: "assistant", content: "✅ Good news! Johnson Bros has same-day availability. They can arrive between 2-5 PM today." },
        { role: "assistant", content: "📅 I've booked your appointment:\n• Service: Emergency leak repair\n• Time: Today, 2-5 PM\n• Tech: Jake will be your plumber\n• Fee waived: $99 emergency fee waived!" },
        { role: "user", content: "That's perfect! Thank you!" },
        { role: "assistant", content: "You're welcome! Jake will text you 30 minutes before arrival. The plumber will bring all necessary tools for leak repair. Is there anything else you need?" }
      ]
    },
    {
      name: "Drain Cleaning",
      messages: [
        { role: "user", content: "My bathroom drain is really slow. Can you schedule Johnson Bros to fix it?" },
        { role: "assistant", content: "I'll schedule Johnson Bros Plumbing for your drain cleaning. Let me find the best available time..." },
        { 
          role: "assistant", 
          content: "Quick form cards make this easy:",
          cards: [
            { title: "Service Type", description: "Bathroom drain cleaning", action: "Use this", icon: <Sparkles className="h-4 w-4" /> },
            { title: "Issue Details", description: "Slow drain + gurgling", action: "Add details", icon: <MessageSquare className="h-4 w-4" /> },
            { title: "Preferred Day", description: "Tomorrow", action: "Pick day", icon: <Calendar className="h-4 w-4" /> },
            { title: "Contact Info", description: "Mobile + email", action: "Add contact", icon: <Phone className="h-4 w-4" /> }
          ]
        },
        { role: "assistant", content: "🔍 Checking availability for drain cleaning service..." },
        { role: "assistant", content: "📅 Available times:\n• Tomorrow: 9 AM - 12 PM\n• Tomorrow: 12 PM - 3 PM\n• Thursday: 9 AM - 12 PM\n\nWhich works best for you?" },
        { role: "user", content: "Tomorrow morning would be great" },
        { role: "assistant", content: "✅ Confirmed! Your drain cleaning is scheduled:\n• Date: Tomorrow, 9 AM - 12 PM\n• Service: Professional drain cleaning\n• Price estimate: $150-250\n• You'll receive a confirmation text shortly!" }
      ]
    },
    {
      name: "Water Heater",
      messages: [
        { role: "user", content: "I'm not getting hot water. Can Johnson Bros check my water heater?" },
        { role: "assistant", content: "I'll help you book Johnson Bros for water heater diagnostics. Let me access their scheduling system..." },
        { 
          role: "assistant", 
          content: "Prefer cards over typing? Fill these:",
          cards: [
            { title: "Service Type", description: "Water heater diagnostic", action: "Use this", icon: <Activity className="h-4 w-4" /> },
            { title: "Symptoms", description: "No hot water", action: "Add symptom", icon: <AlertCircle className="h-4 w-4" /> },
            { title: "Time Window", description: "Today after 3 PM", action: "Set time", icon: <Calendar className="h-4 w-4" /> },
            { title: "Contact Info", description: "Text updates", action: "Add contact", icon: <Phone className="h-4 w-4" /> }
          ]
        },
        { role: "assistant", content: "🔧 Checking technician availability for water heater service..." },
        { role: "assistant", content: "📊 I found availability! Nick, their water heater specialist, has an opening today at 3 PM. Should I book it?" },
        { role: "user", content: "Yes please!" },
        { role: "assistant", content: "✅ Booked successfully!\n• Tech: Nick (Water heater specialist)\n• Time: Today, 3-6 PM\n• Service: Water heater diagnostic & repair\n• Nick will diagnose the issue and provide repair options on-site." }
      ]
    }
  ];

  useEffect(() => {
    const scenario = scenarios[currentScenario];
    setMessages([]);
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < scenario.messages.length) {
        const msg = scenario.messages[messageIndex];
        
        // Show typing indicator
        setMessages(prev => [...prev.filter(m => !m.typing), { ...msg, typing: true }]);
        
        setTimeout(() => {
          setMessages(prev => [...prev.filter(m => !m.typing), msg]);
        }, 500);
        
        messageIndex++;
      } else {
        // Reset after scenario completes
        setTimeout(() => {
          setCurrentScenario((prev) => (prev + 1) % scenarios.length);
        }, 3000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentScenario]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-400" />
          <span className="text-white font-medium">AI Assistant Demo</span>
        </div>
        <div className="flex gap-1">
          {scenarios.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentScenario ? "bg-blue-400 w-6" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="text-sm text-gray-400 mb-3">
        Scenario: {scenarios[currentScenario].name}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[80%] space-y-3">
                <div
                  className={`rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  } ${msg.typing ? "opacity-70" : ""}`}
                >
                  {msg.typing ? (
                    <div className="flex gap-1">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce delay-100">•</span>
                      <span className="animate-bounce delay-200">•</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line">{msg.content}</div>
                  )}
                </div>
                {!msg.typing && msg.cards && (
                  <div className="grid gap-3">
                    {msg.cards.map((card, cardIndex) => (
                      <div
                        key={`${card.title}-${cardIndex}`}
                        className="rounded-lg border border-blue-500/40 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/60 p-3 shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 rounded-md bg-blue-500/20 p-1.5 text-blue-200">
                              {card.icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">{card.title}</p>
                              <p className="text-xs text-blue-100/80">{card.description}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-100">
                            {card.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Animated Workflow Diagram Component
const WorkflowDiagram = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    { icon: <MessageSquare />, title: "Open AI Assistant", desc: "ChatGPT, Claude, or any AI" },
    { icon: <Mic />, title: "Describe Problem", desc: "Natural conversation" },
    { icon: <Brain />, title: "AI Books Service", desc: "Handles everything automatically" },
    { icon: <CheckCircle />, title: "Confirmed!", desc: "Instant confirmation" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: activeStep === index ? 1.05 : 1
            }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`bg-white rounded-xl p-6 border-2 transition-all ${
                activeStep === index
                  ? "border-blue-500 shadow-xl shadow-blue-500/20"
                  : "border-gray-200"
              }`}
            >
              <motion.div
                animate={{
                  rotate: activeStep === index ? 360 : 0,
                }}
                transition={{ duration: 0.5 }}
                className={`inline-flex p-3 rounded-lg mb-4 ${
                  activeStep === index
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {step.icon}
              </motion.div>
              <h4 className="font-semibold mb-2">{step.title}</h4>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                <ChevronRight 
                  className={`h-6 w-6 transition-colors ${
                    activeStep > index ? "text-blue-500" : "text-gray-300"
                  }`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Stats Counter Component
const StatsCounter = ({ end, label }: { end: number; label: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (countRef.current) {
      observer.observe(countRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const duration = 2000;
      const increment = end / (duration / 16);
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [isVisible, end]);

  return (
    <div ref={countRef} className="text-center">
      <div className="text-4xl font-bold text-blue-600">{count}{label === "%" ? "%" : label === "ms" ? "ms" : ""}</div>
      <div className="text-gray-600 mt-1">{label === "%" ? "Uptime" : label === "ms" ? "Avg Response" : "AI Bookings"}</div>
    </div>
  );
};

export default function AIBooking() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
      <SEO
        title="AI Assistant Booking | Johnson Bros. Plumbing - Book Through ChatGPT & Claude"
        description="First plumbing company with native AI integration. Book our services directly through ChatGPT, Claude, or any AI assistant. No forms, no calls - just natural conversation."
        keywords={["AI plumbing booking", "ChatGPT plumber", "Claude plumbing", "MCP integration", "automated plumbing booking", "AI assistant booking"]}
        url="/ai-booking"
        type="website"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header onBookService={() => setIsBookingModalOpen(true)} />
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Industry First: AI-Native Plumbing Service</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Book Plumbing Services Through{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                Any AI Assistant
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              First plumbing company with native AI integration - Use ChatGPT, Claude, or any AI to book our services instantly
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => window.open("https://chatgpt.com/?q=Book+Johnson+Bros+Plumbing+for+my+plumbing+issue", "_blank")}
              >
                <Bot className="mr-2 h-5 w-5" />
                Try with ChatGPT
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsBookingModalOpen(true)}
              >
                Traditional Booking
              </Button>
            </div>
            
            {/* Floating AI Icons */}
            <div className="relative h-32">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute left-1/4 top-0"
              >
                <div className="bg-white shadow-lg rounded-xl p-3">
                  <AIIcon platform="chatgpt" />
                </div>
              </motion.div>
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                className="absolute right-1/4 top-0"
              >
                <div className="bg-white shadow-lg rounded-xl p-3">
                  <AIIcon platform="claude" />
                </div>
              </motion.div>
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 3, 0]
                }}
                transition={{ repeat: Infinity, duration: 3, delay: 1 }}
                className="absolute left-1/2 top-12 -translate-x-1/2"
              >
                <div className="bg-white shadow-lg rounded-xl p-3">
                  <AIIcon platform="gemini" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-gray-600">Four simple steps to book plumbing services with AI</p>
            </motion.div>
            
            <WorkflowDiagram />
          </div>
        </section>

        {/* Live Demo Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
              <p className="text-xl text-gray-600">Watch how AI assistants handle real booking scenarios</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <ChatSimulator />
              
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Real-Time Availability
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Today</span>
                      <Badge className="bg-green-500">3 slots available</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Tomorrow</span>
                      <Badge className="bg-blue-500">5 slots available</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">This Week</span>
                      <Badge variant="secondary">12 slots available</Badge>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Natural Language Understanding
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Understands urgency levels automatically</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Identifies service type from description</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Handles scheduling preferences</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Provides accurate time estimates</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">Revolutionary Benefits</h2>
              <p className="text-xl text-gray-600">Why AI booking is changing the game</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Clock className="h-6 w-6" />,
                  title: "24/7 Availability",
                  description: "Book services anytime, even at 3 AM. AI never sleeps."
                },
                {
                  icon: <Brain className="h-6 w-6" />,
                  title: "Smart Service Matching",
                  description: "AI understands your problem and suggests the right service automatically."
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: "Instant Scheduling",
                  description: "Real-time availability checking and booking confirmation in seconds."
                },
                {
                  icon: <Globe className="h-6 w-6" />,
                  title: "Universal Compatibility",
                  description: "Works with ChatGPT, Claude, Gemini, and any MCP-compatible AI."
                },
                {
                  icon: <Users className="h-6 w-6" />,
                  title: "Perfect for Businesses",
                  description: "Property managers can book for multiple properties efficiently."
                },
                {
                  icon: <Shield className="h-6 w-6" />,
                  title: "Secure & Private",
                  description: "Enterprise-grade security with full data encryption."
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="inline-flex p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Innovation Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">Technical Excellence</h2>
              <p className="text-xl text-gray-600">Built on cutting-edge Model Context Protocol (MCP)</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-8">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-blue-500" />
                  MCP Integration
                </h3>
                <p className="text-gray-600 mb-6">
                  We've implemented the Model Context Protocol (MCP) to provide seamless integration with AI assistants. 
                  This allows any AI to access our booking system, check availability, and complete bookings in real-time.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Native API integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Real-time synchronization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Automatic dispatch integration</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-8">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-500" />
                  Performance Stats
                </h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <StatsCounter end={99.9} label="%" />
                  <StatsCounter end={250} label="ms" />
                  <StatsCounter end={1247} label="" />
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>API Response Time</span>
                    <span className="font-semibold">&lt; 300ms</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Success Rate</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Security Rating</span>
                    <span className="font-semibold">A+</span>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Supported AI Platforms</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  { name: "ChatGPT", icon: "chatgpt" },
                  { name: "Claude", icon: "claude" },
                  { name: "Gemini", icon: "gemini" },
                  { name: "Alexa", icon: "alexa" },
                  { name: "Siri", icon: "siri" },
                  { name: "Google", icon: "assistant" }
                ].map((platform, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    className="text-center"
                  >
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-2">
                      <AIIcon platform={platform.icon} />
                    </div>
                    <span className="text-sm">{platform.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">Perfect For Every Situation</h2>
              <p className="text-xl text-gray-600">See how different customers benefit from AI booking</p>
            </motion.div>
            
            <Tabs defaultValue="property" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="property">Property Managers</TabsTrigger>
                <TabsTrigger value="professional">Professionals</TabsTrigger>
                <TabsTrigger value="elderly">Seniors</TabsTrigger>
                <TabsTrigger value="smart">Smart Homes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="property" className="mt-8">
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <Building className="h-12 w-12 text-blue-500 mb-4" />
                      <h3 className="text-2xl font-semibold mb-4">Property Management Revolution</h3>
                      <p className="text-gray-600 mb-6">
                        Manage maintenance for multiple properties effortlessly. AI can handle bookings for different addresses, 
                        track service history, and coordinate multiple appointments simultaneously.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Book for multiple properties in one conversation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>AI remembers property-specific requirements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Automatic tenant notification coordination</span>
                        </li>
                      </ul>
                    </div>
                    <div className="md:w-1/3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
                      <div className="text-sm text-gray-600">Time saved on maintenance scheduling</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="professional" className="mt-8">
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <Headphones className="h-12 w-12 text-purple-500 mb-4" />
                      <h3 className="text-2xl font-semibold mb-4">Voice-First for Busy Professionals</h3>
                      <p className="text-gray-600 mb-6">
                        Book services while driving, cooking, or working. Just tell your voice assistant about 
                        your plumbing needs and let AI handle the rest.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Hands-free booking through voice commands</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Calendar integration for conflict-free scheduling</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Automated reminders and updates</span>
                        </li>
                      </ul>
                    </div>
                    <div className="md:w-1/3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-purple-600 mb-2">3 min</div>
                      <div className="text-sm text-gray-600">Average booking time</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="elderly" className="mt-8">
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <Users className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-2xl font-semibold mb-4">Simplified for Seniors</h3>
                      <p className="text-gray-600 mb-6">
                        No complicated forms or confusing websites. Just have a natural conversation with 
                        an AI assistant that understands and helps every step of the way.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Natural conversation, no technical knowledge needed</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>AI can repeat information and confirm details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Family members can book on their behalf</span>
                        </li>
                      </ul>
                    </div>
                    <div className="md:w-1/3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                      <div className="text-sm text-gray-600">Customer satisfaction rate</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="smart" className="mt-8">
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <Home className="h-12 w-12 text-orange-500 mb-4" />
                      <h3 className="text-2xl font-semibold mb-4">Smart Home Integration</h3>
                      <p className="text-gray-600 mb-6">
                        Your smart home can detect issues and automatically schedule repairs. Water leak 
                        sensors, smart water heaters, and home assistants work together seamlessly.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Automatic booking when sensors detect issues</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Preventive maintenance scheduling</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <span>Integration with home automation systems</span>
                        </li>
                      </ul>
                    </div>
                    <div className="md:w-1/3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                      <div className="text-sm text-gray-600">Automated monitoring & booking</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Experience the Future of Service Booking
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands who've already discovered the easiest way to book plumbing services
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => {
                    const prompt = encodeURIComponent("I need to book Johnson Bros Plumbing for a plumbing issue at my home. Can you help me schedule an appointment?");
                    window.open(`https://chat.openai.com/?q=${prompt}`, "_blank");
                  }}
                >
                  <Bot className="mr-2 h-5 w-5" />
                  Try It Now with ChatGPT
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={() => setIsBookingModalOpen(true)}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Traditional Booking
                </Button>
              </div>
              
              <Card className="bg-white/10 backdrop-blur border-white/20 p-8">
                <h3 className="text-2xl font-semibold mb-4">For Developers & Partners</h3>
                <p className="mb-6 opacity-90">
                  Want to integrate our MCP API into your application or AI assistant?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                    onClick={() => window.open("/api/mcp/docs", "_blank")}
                  >
                    <Code className="mr-2 h-5 w-5" />
                    View API Docs
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                    onClick={() => window.location.href = "mailto:tech@johnsonbrosplumbing.com?subject=MCP API Access Request"}
                  >
                    Request API Access
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <Footer onBookService={() => setIsBookingModalOpen(true)} />
      </div>
      
      <BookingModalEnhanced 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </>
  );
}
