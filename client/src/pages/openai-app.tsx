import { Helmet } from 'react-helmet-async';
import { PlumbingAssistantApp } from '@/components/openai-app';

export default function OpenAIAppPage() {
  return (
    <>
      <Helmet>
        <title>AI Plumbing Assistant | Johnson Bros. Plumbing</title>
        <meta name="description" content="Get instant help with plumbing issues, book appointments, and get quotes from our AI-powered assistant. Available 24/7 for all your plumbing needs." />
      </Helmet>
      <div className="h-screen">
        <PlumbingAssistantApp />
      </div>
    </>
  );
}
