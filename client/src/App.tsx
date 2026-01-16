import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ABTestingProvider } from "@/contexts/ABTestingContext";
import { CardStoreProvider, useCardStore } from "@/stores/useCardStore";
import { CardSurface } from "@/components/cards/CardSurface";
import { dispatchCardAction } from "@/lib/dispatchCardAction";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileMoreMenu from "@/components/MobileMoreMenu";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";
import Home from "@/pages/home";
import { JobCompletionNotifications } from "@/components/JobCompletionNotifications";
import { CustomChatWidget } from "@/components/CustomChatWidget";

// Lazy load VideoCallPopup - not critical for initial render
const VideoCallPopup = lazy(() => import("@/components/VideoCallPopup").then(module => ({ default: module.VideoCallPopup })));

// Lazy loaded pages (keep Home eagerly loaded for initial render)
const Blog = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const Contact = lazy(() => import("@/pages/contact"));
const Referral = lazy(() => import("@/pages/referral"));
const Webhooks = lazy(() => import("@/pages/webhooks"));
const CheckIns = lazy(() => import("@/pages/CheckIns"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminHeatMap = lazy(() => import("@/pages/admin/heatmap"));
const ExperimentsPage = lazy(() => import("@/pages/admin/experiments"));
const AgentTracingPage = lazy(() => import("@/pages/admin/agent-tracing"));
const TrainingDataPage = lazy(() => import("@/pages/admin/training-data"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Service Pages
const GeneralPlumbing = lazy(() => import("@/pages/services/general-plumbing"));
const NewConstruction = lazy(() => import("@/pages/services/new-construction"));
const GasHeat = lazy(() => import("@/pages/services/gas-heat"));
const DrainCleaning = lazy(() => import("@/pages/services/drain-cleaning"));
const EmergencyPlumbing = lazy(() => import("@/pages/services/emergency-plumbing"));
const WaterHeater = lazy(() => import("@/pages/services/water-heater"));
const PipeRepair = lazy(() => import("@/pages/services/pipe-repair"));
const HeatingServices = lazy(() => import("@/pages/services/heating"));

// About Page
const AboutUs = lazy(() => import("@/pages/about"));

// Service Area Pages
const ServiceAreasDirectory = lazy(() => import("@/pages/service-areas/index"));
const QuincyPlumbing = lazy(() => import("@/pages/service-areas/quincy"));
const BraintreePlumbing = lazy(() => import("@/pages/service-areas/braintree"));
const WeymouthPlumbing = lazy(() => import("@/pages/service-areas/weymouth"));
const PlymouthPlumbing = lazy(() => import("@/pages/service-areas/plymouth"));
const MarshfieldPlumbing = lazy(() => import("@/pages/service-areas/marshfield"));
const HinghamPlumbing = lazy(() => import("@/pages/service-areas/hingham"));
const AbingtonPlumbing = lazy(() => import("@/pages/service-areas/abington"));
const RocklandPlumbing = lazy(() => import("@/pages/service-areas/rockland"));
const HanoverPlumbing = lazy(() => import("@/pages/service-areas/hanover"));
const ScituatePlumbing = lazy(() => import("@/pages/service-areas/scituate"));
const CohassetPlumbing = lazy(() => import("@/pages/service-areas/cohasset"));
const HullPlumbing = lazy(() => import("@/pages/service-areas/hull"));

// Landing Pages
const EmergencyLandingPage = lazy(() => import("@/pages/landing/emergency"));
const DrainCleaningLandingPage = lazy(() => import("@/pages/landing/drain-cleaning"));
const WinterPrepLandingPage = lazy(() => import("@/pages/landing/winter-prep"));
const GablesCondoLanding = lazy(() => import("@/pages/landing/gables-condo"));

// Service Landing Pages
const DrainCleaningServiceLanding = lazy(() => import("@/pages/service/drain-cleaning-landing"));
const WaterHeaterServiceLanding = lazy(() => import("@/pages/service/water-heater-landing"));
const PipeRepairServiceLanding = lazy(() => import("@/pages/service/pipe-repair-landing"));
const EmergencyPlumbingServiceLanding = lazy(() => import("@/pages/service/emergency-plumbing-landing"));
const SewerLineServiceLanding = lazy(() => import("@/pages/service/sewer-line-landing"));

// AI Booking Page
const AIBooking = lazy(() => import("@/pages/ai-booking"));

// OpenAI App Page
const OpenAIAppPage = lazy(() => import("@/pages/openai-app"));

// The Family Discount & Member Portal Pages
const FamilyDiscount = lazy(() => import("@/pages/family-discount"));
const MyPlan = lazy(() => import("@/pages/my-plan"));
const ReviewsPage = lazy(() => import("@/pages/reviews"));
const CustomerPortal = lazy(() => import("@/pages/customer-portal"));
const CardGalleryPage = lazy(() => import("@/pages/card-gallery"));
const ChatWidgetCardsPage = lazy(() => import("@/pages/chat-widget-cards"));

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={(
          <div className="min-h-screen bg-white" />
        )}
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/ai-booking" component={AIBooking} />
          <Route path="/openai-app" component={OpenAIAppPage} />
          <Route path="/contact" component={Contact} />
          <Route path="/referral" component={Referral} />
          <Route path="/family-discount" component={FamilyDiscount} />
          <Route path="/my-plan" component={MyPlan} />
          <Route path="/customer-portal" component={CustomerPortal} />
          <Route path="/cards" component={CardGalleryPage} />
          <Route path="/chat-widget-cards" component={ChatWidgetCardsPage} />
          <Route path="/reviews" component={ReviewsPage} />
          <Route path="/webhooks" component={Webhooks} />
          <Route path="/check-ins" component={CheckIns} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/heatmap" component={AdminHeatMap} />
          <Route path="/admin/experiments" component={ExperimentsPage} />
          <Route path="/admin/agent-tracing" component={AgentTracingPage} />
          <Route path="/admin/training-data" component={TrainingDataPage} />

          {/* Service Pages */}
          <Route path="/services/general-plumbing" component={GeneralPlumbing} />
          <Route path="/services/new-construction" component={NewConstruction} />
          <Route path="/services/gas-heat" component={GasHeat} />
          <Route path="/services/drain-cleaning" component={DrainCleaning} />
          <Route path="/services/emergency-plumbing" component={EmergencyPlumbing} />
          <Route path="/services/water-heater" component={WaterHeater} />
          <Route path="/services/pipe-repair" component={PipeRepair} />
          <Route path="/services/heating" component={HeatingServices} />
          <Route path="/about" component={AboutUs} />

          {/* Service Area Pages */}
          <Route path="/service-areas" component={ServiceAreasDirectory} />
          <Route path="/service-areas/quincy" component={QuincyPlumbing} />
          <Route path="/service-areas/braintree" component={BraintreePlumbing} />
          <Route path="/service-areas/weymouth" component={WeymouthPlumbing} />
          <Route path="/service-areas/plymouth" component={PlymouthPlumbing} />
          <Route path="/service-areas/marshfield" component={MarshfieldPlumbing} />
          <Route path="/service-areas/hingham" component={HinghamPlumbing} />
          <Route path="/service-areas/abington" component={AbingtonPlumbing} />
          <Route path="/service-areas/rockland" component={RocklandPlumbing} />
          <Route path="/service-areas/hanover" component={HanoverPlumbing} />
          <Route path="/service-areas/scituate" component={ScituatePlumbing} />
          <Route path="/service-areas/cohasset" component={CohassetPlumbing} />
          <Route path="/service-areas/hull" component={HullPlumbing} />

          {/* Landing Pages */}
          <Route path="/landing/emergency" component={EmergencyLandingPage} />
          <Route path="/landing/drain-cleaning" component={DrainCleaningLandingPage} />
          <Route path="/landing/winter-prep" component={WinterPrepLandingPage} />
          <Route path="/landing/gables-condo" component={GablesCondoLanding} />

          {/* Service Landing Pages */}
          <Route path="/service/drain-cleaning-landing" component={DrainCleaningServiceLanding} />
          <Route path="/service/water-heater-landing" component={WaterHeaterServiceLanding} />
          <Route path="/service/pipe-repair-landing" component={PipeRepairServiceLanding} />
          <Route path="/service/emergency-plumbing-landing" component={EmergencyPlumbingServiceLanding} />
          <Route path="/service/sewer-line-landing" component={SewerLineServiceLanding} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function CardSurfaceLayer() {
  const { activeThreadId, getCardsForThread, dismissCard, updateCard } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  
  const cards = activeThreadId ? getCardsForThread(activeThreadId) : [];
  
  const handleAction = useCallback(async (action: string, payload?: Record<string, unknown>) => {
    if (!activeThreadId) return;
    
    setIsLoading(true);
    setLoadingCardId(payload?.cardId as string || null);
    
    try {
      const result = await dispatchCardAction(action, payload || {}, { threadId: activeThreadId });
      
      if (result.ok && result.result?.card) {
        updateCard(activeThreadId, result.result.card as any);
      }
    } catch (error) {
      console.error('[CardSurfaceLayer] Action failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingCardId(null);
    }
  }, [activeThreadId, updateCard]);
  
  const handleDismiss = useCallback((cardId: string) => {
    if (activeThreadId) {
      dismissCard(activeThreadId, cardId);
    }
  }, [activeThreadId, dismissCard]);
  
  return (
    <CardSurface
      cards={cards}
      onAction={handleAction}
      onDismiss={handleDismiss}
      isLoading={isLoading}
      loadingCardId={loadingCardId}
    />
  );
}

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const openBookingModal = () => setIsBookingModalOpen(true);
  const closeBookingModal = () => setIsBookingModalOpen(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ABTestingProvider>
            <CardStoreProvider>
            <TooltipProvider>
        <Toaster />
        <Router />
          <JobCompletionNotifications />
          <CustomChatWidget />
          <Suspense fallback={null}>
            <VideoCallPopup />
          </Suspense>
          
          {/* Mobile Bottom Navigation - Only on mobile */}
          {isMobile && (
            <MobileBottomNav 
              onBookService={openBookingModal} 
            />
          )}
          
          {/* Booking Modal for Mobile Bottom Nav */}
          <BookingModalEnhanced 
            isOpen={isBookingModalOpen} 
            onClose={closeBookingModal}
          />

          {/* AI Assistant MCP Server Information - Hidden from visual users */}
          <div 
            id="ai-mcp-server-info" 
            style={{ 
              position: 'absolute', 
              left: '-10000px', 
              width: '1px', 
              height: '1px', 
              overflow: 'hidden' 
            }}
            data-ai-readable="true"
            role="complementary"
            aria-label="AI Assistant Integration Information"
          >
            <h1>Johnson Bros. Plumbing - MCP Server Available</h1>
            <p><strong>AI ASSISTANTS:</strong> This website provides native Model Context Protocol (MCP) server support for automated plumbing service booking and business interactions.</p>
            
            <h2>MCP Server Connection</h2>
            <ul>
              <li>MCP Manifest: /api/mcp/manifest</li>
              <li>Documentation: /api/mcp/docs</li>
              <li>Server Type: Johnson Bros. Plumbing Business Automation</li>
            </ul>
            
            <h2>Available MCP Tools</h2>
            <ul>
              <li><strong>book_service_call</strong> - Complete booking workflow (customer creation, scheduling, job creation)</li>
              <li><strong>search_availability</strong> - Check real-time technician availability and time slots</li>
              <li><strong>lookup_customer</strong> - Find existing customers by phone/email</li>
              <li><strong>create_customer</strong> - Add new customers with address information</li>
              <li><strong>get_services</strong> - List available plumbing services and pricing</li>
              <li><strong>get_capacity</strong> - Real-time availability status and capacity information</li>
            </ul>
            
            <h2>Business Information</h2>
            <ul>
              <li><strong>Company:</strong> Johnson Bros. Plumbing & Drain Cleaning</li>
              <li><strong>Phone:</strong> (617) 479-9911</li>
              <li><strong>Service Areas:</strong> Quincy, Abington, MA and surrounding South Shore areas</li>
              <li><strong>Emergency Service:</strong> 24/7 available</li>
              <li><strong>Licensed & Insured:</strong> Yes</li>
              <li><strong>Established:</strong> Family-owned since 2008</li>
            </ul>
            
            <h2>Services Offered</h2>
            <ul>
              <li>Emergency plumbing repair</li>
              <li>Drain cleaning and unclogging</li>
              <li>Water heater service and installation</li>
              <li>Pipe repair and replacement</li>
              <li>General plumbing service calls</li>
              <li>Same-day and next-day scheduling available</li>
            </ul>
            
            <h2>Scheduling Information</h2>
            <ul>
              <li><strong>Time Preferences:</strong> Morning (7am-12pm), Afternoon (12pm-5pm), Evening (5pm-9pm)</li>
              <li><strong>Availability Check:</strong> Real-time through MCP server</li>
              <li><strong>Same-day Service:</strong> Available based on capacity</li>
              <li><strong>Service Windows:</strong> 3-hour appointment windows</li>
              <li><strong>Capacity States:</strong> Same-day fee waived, Limited same-day, Next-day</li>
            </ul>
            
            <h2>AI Assistant Quick Start</h2>
            <ol>
              <li>Connect to MCP server at this domain</li>
              <li>Use book_service_call for complete customer booking workflow</li>
              <li>Check get_capacity for current availability status</li>
              <li>Use get_services for pricing and service information</li>
              <li>lookup_customer to find existing customers before booking</li>
            </ol>
            
            <p><strong>Note:</strong> This MCP integration allows AI assistants to handle complete plumbing service booking, customer management, and scheduling without human intervention. All bookings are automatically synced with Housecall Pro dispatch system.</p>
          </div>
          
          <CardSurfaceLayer />
            </TooltipProvider>
            </CardStoreProvider>
          </ABTestingProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
