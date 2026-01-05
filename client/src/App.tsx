import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ABTestingProvider } from "@/contexts/ABTestingContext";
import { lazy, Suspense, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomNav from "@/components/MobileBottomNav";
import BookingModalEnhanced from "@/components/BookingModalEnhanced";
import Home from "@/pages/home";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Contact from "@/pages/contact";
import Referral from "@/pages/referral";
import Webhooks from "@/pages/webhooks";
import CheckIns from "@/pages/CheckIns";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminHeatMap from "@/pages/admin/heatmap";
import ExperimentsPage from "@/pages/admin/experiments";
import NotFound from "@/pages/not-found";
import { JobCompletionNotifications } from "@/components/JobCompletionNotifications";
import { BookingAgentChat } from "@/components/BookingAgentChat";

// Lazy load VideoCallPopup - not critical for initial render
const VideoCallPopup = lazy(() => import("@/components/VideoCallPopup").then(module => ({ default: module.VideoCallPopup })));

// Service Pages
import GeneralPlumbing from "@/pages/services/general-plumbing";
import NewConstruction from "@/pages/services/new-construction";
import GasHeat from "@/pages/services/gas-heat";
import DrainCleaning from "@/pages/services/drain-cleaning";
import EmergencyPlumbing from "@/pages/services/emergency-plumbing";
import WaterHeater from "@/pages/services/water-heater";
import PipeRepair from "@/pages/services/pipe-repair";
import HeatingServices from "@/pages/services/heating";

// About Page
import AboutUs from "@/pages/about";

// Service Area Pages
import QuincyPlumbing from "@/pages/service-areas/quincy";
import BraintreePlumbing from "@/pages/service-areas/braintree";
import WeymouthPlumbing from "@/pages/service-areas/weymouth";
import PlymouthPlumbing from "@/pages/service-areas/plymouth";
import MarshfieldPlumbing from "@/pages/service-areas/marshfield";
import HinghamPlumbing from "@/pages/service-areas/hingham";

// Landing Pages
import EmergencyLandingPage from "@/pages/landing/emergency";
import DrainCleaningLandingPage from "@/pages/landing/drain-cleaning";
import WinterPrepLandingPage from "@/pages/landing/winter-prep";
import GablesCondoLanding from "@/pages/landing/gables-condo";

// Service Landing Pages
import DrainCleaningServiceLanding from "@/pages/service/drain-cleaning-landing";
import WaterHeaterServiceLanding from "@/pages/service/water-heater-landing";
import PipeRepairServiceLanding from "@/pages/service/pipe-repair-landing";
import EmergencyPlumbingServiceLanding from "@/pages/service/emergency-plumbing-landing";
import SewerLineServiceLanding from "@/pages/service/sewer-line-landing";

// AI Booking Page
import AIBooking from "@/pages/ai-booking";

// The Family Discount & Member Portal Pages
import FamilyDiscount from "@/pages/family-discount";
import MyPlan from "@/pages/my-plan";

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
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/ai-booking" component={AIBooking} />
      <Route path="/contact" component={Contact} />
      <Route path="/referral" component={Referral} />
      <Route path="/family-discount" component={FamilyDiscount} />
      <Route path="/my-plan" component={MyPlan} />
      <Route path="/webhooks" component={Webhooks} />
      <Route path="/check-ins" component={CheckIns} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/heatmap" component={AdminHeatMap} />
      <Route path="/admin/experiments" component={ExperimentsPage} />
      
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
      <Route path="/service-areas/quincy" component={QuincyPlumbing} />
      <Route path="/service-areas/braintree" component={BraintreePlumbing} />
      <Route path="/service-areas/weymouth" component={WeymouthPlumbing} />
      <Route path="/service-areas/plymouth" component={PlymouthPlumbing} />
      <Route path="/service-areas/marshfield" component={MarshfieldPlumbing} />
      <Route path="/service-areas/hingham" component={HinghamPlumbing} />
      
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
    </>
  );
}

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const openBookingModal = () => setIsBookingModalOpen(true);
  const closeBookingModal = () => setIsBookingModalOpen(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ABTestingProvider>
            <TooltipProvider>
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
        
        <Toaster />
        <Router />
          <JobCompletionNotifications />
          <BookingAgentChat />
          <Suspense fallback={null}>
            <VideoCallPopup />
          </Suspense>
          
          {/* Mobile Bottom Navigation - Only on mobile */}
          {isMobile && <MobileBottomNav onBookService={openBookingModal} />}
          
          {/* Booking Modal for Mobile Bottom Nav */}
          <BookingModalEnhanced 
            isOpen={isBookingModalOpen} 
            onClose={closeBookingModal}
          />
            </TooltipProvider>
          </ABTestingProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
