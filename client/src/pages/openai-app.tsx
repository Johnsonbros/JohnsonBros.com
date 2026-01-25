import { Helmet } from 'react-helmet-async';
import { PlumbingAssistantApp } from '@/components/openai-app';

export default function OpenAIAppPage() {
  return (
    <>
      <Helmet>
        <title>AI Plumbing Assistant | Johnson Bros. Plumbing</title>
        <meta name="description" content="Get instant help with plumbing issues, book appointments, and get quotes from our AI-powered assistant. Available 24/7 for all your plumbing needs." />
        <meta name="ai-integration" content="mcp-enabled" />
        <meta name="mcp-server" content="/api/mcp/manifest" />
        <meta name="ai-business-phone" content="617-479-9911" />
        <link rel="alternate" type="application/x-mcp+json" href="/api/mcp/manifest" title="MCP Server for AI Assistants" />
      </Helmet>
      <div className="h-screen">
        <PlumbingAssistantApp />
      </div>
    </>
  );
}
