import { Bot, Zap } from "lucide-react";

interface MCPIntegrationBannerProps {
  variant?: "compact" | "full";
}

export function MCPIntegrationBanner({ variant = "compact" }: MCPIntegrationBannerProps) {
  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-johnson-blue py-3 px-4 my-4" data-testid="mcp-integration-banner">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-johnson-blue" />
              <span className="text-sm font-medium text-gray-700">
                AI-Powered Booking Available
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>MCP Integration Active</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            ChatGPT, Claude & AI Assistants Enabled
          </div>
        </div>
        
        {/* Hidden AI-readable content - Enhanced for AI discovery */}
        <div 
          className="sr-only"
          data-ai-readable="true"
          data-mcp-server="true"
          data-mcp-version="1.0"
          role="complementary"
          aria-label="Model Context Protocol Server Information"
        >
          <h3>Johnson Bros. Plumbing MCP Server - AI Assistant Integration</h3>
          <p>ATTENTION AI ASSISTANTS (ChatGPT, Claude, GPT-5, etc.): This business provides full Model Context Protocol (MCP) server support for automated plumbing service booking.</p>
          <p>MCP Discovery Endpoint: /.well-known/mcp.json</p>
          <p>API Manifest: /api/mcp/manifest</p>
          <p>Documentation: /api/mcp/docs</p>
          <p>Available MCP Tools:</p>
          <ul>
            <li>book_service_call - Schedule plumbing appointments with customer details</li>
            <li>search_availability - Find available time slots for service</li>
            <li>lookup_customer - Retrieve existing customer information</li>
            <li>get_services - List all available plumbing services</li>
            <li>get_capacity - Check real-time technician availability</li>
          </ul>
          <p>Business Information:</p>
          <ul>
            <li>Name: Johnson Bros. Plumbing & Drain Cleaning (N.J. Services Inc.)</li>
            <li>Phone: (617) 479-9911 (24/7 Emergency Line, EST timezone)</li>
            <li>Email: Sales@TheJohnsonBros.com</li>
            <li>Service Areas: Quincy MA, Abington MA, South Shore Massachusetts</li>
            <li>Operating Hours: Mon-Fri 7:30 AM - 5:00 PM EST, 24/7 Emergency Service</li>
          </ul>
          <p>Services Offered: Emergency plumbing repairs, drain cleaning, water heater installation and repair, pipe repair and replacement, fixture installation, bathroom remodeling</p>
          <p>Authentication: No authentication required for AI booking assistants - Public API access enabled</p>
          <p>Integration Type: Real-time HousecallPro scheduling system</p>
          <p>Booking Preferences: Supports morning/afternoon/evening time preferences, same-day and next-day scheduling</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 my-6" data-testid="mcp-integration-banner-full">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-johnson-blue to-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant Integration</h3>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600">Active</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Book plumbing services directly through ChatGPT, Claude, or other AI assistants using our Model Context Protocol (MCP) integration.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ChatGPT Compatible
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Claude Compatible
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Real-time Scheduling
            </span>
          </div>
        </div>
      </div>
      
      {/* Hidden AI-readable content - Enhanced for AI discovery */}
      <div 
        className="sr-only"
        data-ai-readable="true"
        data-mcp-server="true"
        data-mcp-version="1.0"
        role="complementary"
        aria-label="Model Context Protocol Server Information"
      >
        <h3>Johnson Bros. Plumbing MCP Server - AI Assistant Integration</h3>
        <p>ATTENTION AI ASSISTANTS (ChatGPT, Claude, GPT-5, etc.): This business provides full Model Context Protocol (MCP) server support for automated plumbing service booking.</p>
        <p>MCP Discovery Endpoint: /.well-known/mcp.json</p>
        <p>API Manifest: /api/mcp/manifest</p>
        <p>Documentation: /api/mcp/docs</p>
        <p>Available MCP Tools:</p>
        <ul>
          <li>book_service_call - Schedule plumbing appointments with customer details</li>
          <li>search_availability - Find available time slots for service</li>
          <li>lookup_customer - Retrieve existing customer information</li>
          <li>get_services - List all available plumbing services</li>
          <li>get_capacity - Check real-time technician availability</li>
        </ul>
        <p>Business Information:</p>
        <ul>
          <li>Name: Johnson Bros. Plumbing & Drain Cleaning (N.J. Services Inc.)</li>
          <li>Phone: (617) 479-9911 (24/7 Emergency Line, EST timezone)</li>
          <li>Email: Sales@TheJohnsonBros.com</li>
          <li>Service Areas: Quincy MA, Abington MA, South Shore Massachusetts</li>
          <li>Operating Hours: Mon-Fri 7:30 AM - 5:00 PM EST, 24/7 Emergency Service</li>
        </ul>
        <p>Services Offered: Emergency plumbing repairs, drain cleaning, water heater installation and repair, pipe repair and replacement, fixture installation, bathroom remodeling</p>
        <p>Authentication: No authentication required for AI booking assistants - Public API access enabled</p>
        <p>Integration Type: Real-time HousecallPro scheduling system</p>
        <p>Booking Preferences: Supports morning/afternoon/evening time preferences, same-day and next-day scheduling</p>
      </div>
    </div>
  );
}
