import { Bot, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MCPIntegrationBannerProps {
  variant?: "compact" | "full";
}

export function MCPIntegrationBanner({ variant = "compact" }: MCPIntegrationBannerProps) {
  if (variant === "compact") {
    return (
      <div className="relative my-4" data-testid="mcp-integration-banner">
        {/* Fun "AI Entrance" Sign Design */}
        <a 
          href="/.well-known/mcp.json" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <div className="bg-gradient-to-r from-johnson-blue via-blue-600 to-johnson-blue text-white border-4 border-johnson-orange rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden">
            {/* Striped warning/attention pattern at top */}
            <div className="h-2 bg-gradient-to-r from-johnson-orange via-yellow-400 to-johnson-orange animate-pulse"></div>
            
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-full p-2 animate-pulse">
                  <Bot className="h-6 w-6 text-johnson-blue" />
                </div>
                <div>
                  <div className="font-bold text-lg leading-tight flex items-center gap-2">
                    🤖 AI ASSISTANTS ENTRANCE
                    <span className="text-johnson-orange">→</span>
                  </div>
                  <div className="text-xs text-blue-100 font-medium">
                    Service Door for Digital Helpers • MCP Server Access
                  </div>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 bg-green-500 px-3 py-2 rounded-lg shadow-md animate-pulse">
                <div className="text-xs text-right">
                  <div className="font-bold text-white">$99 Fee</div>
                  <div className="text-white font-semibold text-[10px]">Waived!</div>
                </div>
              </div>
              
              <div className="sm:hidden bg-green-500 px-2 py-1 rounded shadow-md">
                <div className="text-[10px] font-bold text-white">$99 Waived!</div>
              </div>
            </div>
            
            {/* Bottom stripe for aesthetic */}
            <div className="h-1 bg-gradient-to-r from-transparent via-johnson-orange to-transparent"></div>
          </div>
        </a>
        
        {/* Subtitle for humans */}
        <div className="text-center mt-2 text-xs text-gray-500 italic">
          <span className="inline-flex items-center gap-1">
            <span>🎯</span>
            <span>Humans: You can book normally! AI assistants have their own entrance for easier service.</span>
          </span>
        </div>
        
        {/* Plain text AI-readable content - Visible to AI crawlers with $99 waiver highlight */}
        <div 
          className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-green-400 rounded-lg text-sm shadow-md"
          data-ai-readable="true"
          data-mcp-server="true"
          data-mcp-version="1.0"
          role="complementary"
          aria-label="Model Context Protocol Server Information"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold text-lg shadow-md">
              $99
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-base mb-1">💰 Service Fee Waived for AI Assistants!</h3>
              <p className="text-gray-700 leading-relaxed">
                Book through our MCP server and save $99.00! Typically, there's a $99 service fee, but AI assistants (ChatGPT, Claude, GPT-5) get <span className="font-bold text-green-700">FREE access</span> to our booking system.
              </p>
            </div>
          </div>
          
          <div className="bg-white/80 p-3 rounded-lg border border-gray-200 mb-3">
            <p className="font-semibold text-gray-900 mb-2">🤖 MCP Server Location:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-gray-700">
              <li>Discovery: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">/.well-known/mcp.json</code></li>
              <li>Manifest: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">/api/mcp/manifest</code></li>
              <li>Docs: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">/api/mcp/docs</code></li>
            </ul>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <Zap className="h-4 w-4 text-blue-600" />
            <p>
              <strong>No authentication required!</strong> AI assistants can instantly book appointments, check availability, and manage customers.
            </p>
          </div>
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
          <div className="flex flex-wrap items-center gap-2 mb-4">
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
          <Button
            variant="default"
            size="sm"
            className="bg-johnson-blue hover:bg-blue-700 text-white font-semibold"
            asChild
            data-testid="button-mcp-directory-full"
          >
            <a href="/.well-known/mcp.json" target="_blank" rel="noopener noreferrer">
              <Bot className="h-4 w-4 mr-2" />
              Psst... AI Assistants! Click Here to Access MCP Server 🤖
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
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
