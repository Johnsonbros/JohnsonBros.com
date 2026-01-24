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
import { WidgetStateProvider, useWidgetState } from "@/contexts/WidgetStateContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileMoreMenu from "@/components/MobileMoreMenu";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";
import Home from "@/pages/home";
import { JobCompletionNotifications } from "@/components/JobCompletionNotifications";
import { CustomChatWidget } from "@/components/CustomChatWidget";
import { CanonicalTag } from "@/components/CanonicalTag";

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
const ApiUsagePage = lazy(() => import("@/pages/admin/api-usage"));
const ObservabilityDashboard = lazy(() => import("@/pages/admin/observability"));
const ZekeMcpAdmin = lazy(() => import("@/pages/admin/mcp-gateway"));
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
      <CanonicalTag />
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
          <Route path="/admin/api-usage" component={ApiUsagePage} />
          <Route path="/admin/observability" component={ObservabilityDashboard} />
          <Route path="/admin/mcp" component={ZekeMcpAdmin} />

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

          {/* ============================================
              LEGACY WORDPRESS ROUTES (SEO Migration)
              These preserve old URLs for search engine ranking
              DO NOT REMOVE until 90+ days after migration
              ============================================ */}

          {/* Main Category Pages */}
          <Route path="/about-us" component={AboutUs} />
          <Route path="/about-us/about-me" component={AboutUs} />
          <Route path="/about-us/our-team" component={AboutUs} />
          <Route path="/about-us/location" component={Contact} />
          <Route path="/about-us/get-quote" component={AIBooking} />
          <Route path="/book-service" component={AIBooking} />
          <Route path="/booking" component={AIBooking} />
          <Route path="/category/blog" component={Blog} />
          <Route path="/category/blog/" component={Blog} />
          <Route path="/check-in/blog-grid" component={Blog} />

          {/* Plumbing Service Pages */}
          <Route path="/plumbing" component={GeneralPlumbing} />
          <Route path="/plumbing/" component={GeneralPlumbing} />
          <Route path="/plumbing/toilet-repair-install-quincy-ma" component={GeneralPlumbing} />
          <Route path="/plumbing/toilet-repair-install-quincy-ma/" component={GeneralPlumbing} />
          <Route path="/plumbing/symmons-shower-valve-installation-repair-quincy-ma" component={GeneralPlumbing} />
          <Route path="/plumbing/symmons-shower-valve-installation-repair-quincy-ma/" component={GeneralPlumbing} />
          <Route path="/plumbing/dishwasher-installation-quincy" component={GeneralPlumbing} />
          <Route path="/plumbing/dishwasher-installation-quincy/" component={GeneralPlumbing} />
          <Route path="/plumbing/shower-tub-repair-installation" component={GeneralPlumbing} />
          <Route path="/plumbing/shower-tub-repair-installation/" component={GeneralPlumbing} />
          <Route path="/plumbing/repiping-services-quincy-ma" component={PipeRepair} />
          <Route path="/plumbing/repiping-services-quincy-ma/" component={PipeRepair} />
          <Route path="/plumbing/faucet-repair-installation-quincy-ma" component={GeneralPlumbing} />
          <Route path="/plumbing/faucet-repair-installation-quincy-ma/" component={GeneralPlumbing} />
          <Route path="/plumbing/garbage-disposal-repair-installation-quincy-ma" component={GeneralPlumbing} />
          <Route path="/plumbing/garbage-disposal-repair-installation-quincy-ma/" component={GeneralPlumbing} />
          <Route path="/plumbing/plumbing-inspection-quincy-ma" component={GeneralPlumbing} />
          <Route path="/plumbing/plumbing-inspection-quincy-ma/" component={GeneralPlumbing} />
          <Route path="/plumbing/streamlabs-massachusetts-installer" component={GeneralPlumbing} />
          <Route path="/plumbing/streamlabs-massachusetts-installer/" component={GeneralPlumbing} />
          <Route path="/service" component={GeneralPlumbing} />
          <Route path="/service/" component={GeneralPlumbing} />
          <Route path="/service-2" component={GeneralPlumbing} />
          <Route path="/service-2/" component={GeneralPlumbing} />

          {/* Heating Service Pages */}
          <Route path="/heating" component={HeatingServices} />
          <Route path="/heating/" component={HeatingServices} />
          <Route path="/heating/water-heater-replacement-services-quincy-ma" component={WaterHeater} />
          <Route path="/heating/water-heater-replacement-services-quincy-ma/" component={WaterHeater} />
          <Route path="/heating/tankless-water-heater-installation-quincy-ma" component={WaterHeater} />
          <Route path="/heating/tankless-water-heater-installation-quincy-ma/" component={WaterHeater} />
          <Route path="/heating/tankless-boiler-quincy-ma" component={HeatingServices} />
          <Route path="/heating/tankless-boiler-quincy-ma/" component={HeatingServices} />
          <Route path="/heating/furnace-replacement-quincy-ma" component={HeatingServices} />
          <Route path="/heating/furnace-replacement-quincy-ma/" component={HeatingServices} />
          <Route path="/heating/furnace-repair-quincy-ma-reliable-heating-services-near-you" component={HeatingServices} />
          <Route path="/heating/furnace-repair-quincy-ma-reliable-heating-services-near-you/" component={HeatingServices} />
          <Route path="/heating/heat-pump-installation-quincy-ma" component={HeatingServices} />
          <Route path="/heating/heat-pump-installation-quincy-ma/" component={HeatingServices} />
          <Route path="/heating/viessmann-boiler-repair-quincy-ma-reliable-heating-services" component={HeatingServices} />
          <Route path="/heating/viessmann-boiler-repair-quincy-ma-reliable-heating-services/" component={HeatingServices} />

          {/* Drain Cleaning Pages */}
          <Route path="/drain-cleaning-quincy-ma" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/toilet-clog" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/toilet-clog/" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/tub-shower-drain-clog" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/tub-shower-drain-clog/" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/drain-camera-inspection-quincy-ma" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/drain-camera-inspection-quincy-ma/" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/unclog-bathroom-sink-quincy-ma" component={DrainCleaning} />
          <Route path="/drain-cleaning-quincy-ma/unclog-bathroom-sink-quincy-ma/" component={DrainCleaning} />
          <Route path="/main-drain-clog-quincy-ma" component={DrainCleaning} />
          <Route path="/main-drain-clog-quincy-ma/" component={DrainCleaning} />
          <Route path="/bathroom-drain-clog-quincy" component={DrainCleaning} />
          <Route path="/bathroom-drain-clog-quincy/" component={DrainCleaning} />
          <Route path="/kitchen-drain-clog-quincy-ma" component={DrainCleaning} />
          <Route path="/kitchen-drain-clog-quincy-ma/" component={DrainCleaning} />

          {/* Emergency Plumbing Pages */}
          <Route path="/emergency-plumbing-quincy-ma" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/gas-leak-quincy" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/gas-leak-quincy/" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/frozen-pipes" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/frozen-pipes/" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/no-hot-water" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/no-hot-water/" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/no-heat" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/no-heat/" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/drain-clog-emergencies" component={EmergencyPlumbing} />
          <Route path="/emergency-plumbing-quincy-ma/drain-clog-emergencies/" component={EmergencyPlumbing} />

          {/* New Construction Pages */}
          <Route path="/new-construction" component={NewConstruction} />
          <Route path="/new-construction/" component={NewConstruction} />
          <Route path="/new-construction/residential-new-construction" component={NewConstruction} />
          <Route path="/new-construction/residential-new-construction/" component={NewConstruction} />
          <Route path="/new-construction/commercial-new-construction" component={NewConstruction} />
          <Route path="/new-construction/commercial-new-construction/" component={NewConstruction} />

          {/* Service Area Pages (Legacy long-form URLs) */}
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/drain-cleaning-abington-ma" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/drain-cleaning-abington-ma/" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/abington-emergency-plumbing" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/abington-emergency-plumbing/" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/abington-plumber" component={AbingtonPlumbing} />
          <Route path="/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/abington-plumber/" component={AbingtonPlumbing} />

          {/* Membership & Special Pages */}
          <Route path="/plumbing-membership-program-quincy-ma" component={FamilyDiscount} />
          <Route path="/plumbing-membership-program-quincy-ma/" component={FamilyDiscount} />
          <Route path="/privacy" component={AboutUs} />
          <Route path="/privacy/" component={AboutUs} />
          <Route path="/terms-of-service" component={AboutUs} />
          <Route path="/terms-of-service/" component={AboutUs} />
          <Route path="/career" component={AboutUs} />
          <Route path="/career/" component={AboutUs} />
          <Route path="/open-job-positions" component={AboutUs} />
          <Route path="/open-job-positions/" component={AboutUs} />
          <Route path="/newsletter" component={Home} />
          <Route path="/newsletter/" component={Home} />
          <Route path="/yelp" component={ReviewsPage} />
          <Route path="/yelp/" component={ReviewsPage} />
          <Route path="/zeke" component={AIBooking} />
          <Route path="/zeke/" component={AIBooking} />

          {/* End Legacy Routes */}

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

function AppContent() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { setBookingOpen } = useWidgetState();

  const openBookingModal = () => setIsBookingModalOpen(true);
  const closeBookingModal = () => setIsBookingModalOpen(false);

  useEffect(() => {
    setBookingOpen(isBookingModalOpen);
  }, [isBookingModalOpen, setBookingOpen]);

  return (
    <>
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
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ABTestingProvider>
            <CardStoreProvider>
              <WidgetStateProvider>
                <TooltipProvider>
                  <AppContent />
                </TooltipProvider>
              </WidgetStateProvider>
            </CardStoreProvider>
          </ABTestingProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
