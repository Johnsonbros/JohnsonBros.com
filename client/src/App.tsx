import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
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
import NotFound from "@/pages/not-found";
import { JobCompletionNotifications } from "@/components/JobCompletionNotifications";

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

// Service Area Pages
import QuincyPlumbing from "@/pages/service-areas/quincy";
import BraintreePlumbing from "@/pages/service-areas/braintree";
import WeymouthPlumbing from "@/pages/service-areas/weymouth";
import PlymouthPlumbing from "@/pages/service-areas/plymouth";
import MarshfieldPlumbing from "@/pages/service-areas/marshfield";
import HinghamPlumbing from "@/pages/service-areas/hingham";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/contact" component={Contact} />
      <Route path="/referral" component={Referral} />
      <Route path="/webhooks" component={Webhooks} />
      <Route path="/check-ins" component={CheckIns} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/heatmap" component={AdminHeatMap} />
      
      {/* Service Pages */}
      <Route path="/services/general-plumbing" component={GeneralPlumbing} />
      <Route path="/services/new-construction" component={NewConstruction} />
      <Route path="/services/gas-heat" component={GasHeat} />
      <Route path="/services/drain-cleaning" component={DrainCleaning} />
      <Route path="/services/emergency-plumbing" component={EmergencyPlumbing} />
      <Route path="/services/water-heater" component={WaterHeater} />
      <Route path="/services/pipe-repair" component={PipeRepair} />
      
      {/* Service Area Pages */}
      <Route path="/service-areas/quincy" component={QuincyPlumbing} />
      <Route path="/service-areas/braintree" component={BraintreePlumbing} />
      <Route path="/service-areas/weymouth" component={WeymouthPlumbing} />
      <Route path="/service-areas/plymouth" component={PlymouthPlumbing} />
      <Route path="/service-areas/marshfield" component={MarshfieldPlumbing} />
      <Route path="/service-areas/hingham" component={HinghamPlumbing} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
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
            <li><strong>Established:</strong> Family-owned since 1997</li>
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
          <Suspense fallback={null}>
            <VideoCallPopup />
          </Suspense>
        </TooltipProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
