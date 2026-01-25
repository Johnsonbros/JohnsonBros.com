import { useToolOutput, isInChatGPT, useTheme } from './hooks/useOpenAiGlobal';
import { DatePickerCard } from './components/DatePickerCard';
import { TimePickerCard } from './components/TimePickerCard';
import { BookingConfirmationCard } from './components/BookingConfirmationCard';
import { LeadCaptureCard } from './components/LeadCaptureCard';
import { EmergencyHelpCard } from './components/EmergencyHelpCard';
import { QuoteCard } from './components/QuoteCard';
import { ServiceFeeCard } from './components/ServiceFeeCard';
import type { ToolOutput } from './types';

function CardRouter() {
  const toolOutput = useToolOutput<ToolOutput>();

  if (!toolOutput) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        <p>Loading...</p>
      </div>
    );
  }

  switch (toolOutput.type) {
    case 'date_picker':
      return <DatePickerCard data={toolOutput} />;
    case 'time_picker':
      return <TimePickerCard data={toolOutput} />;
    case 'booking_confirmation':
      return <BookingConfirmationCard data={toolOutput} />;
    case 'lead_capture':
      return <LeadCaptureCard data={toolOutput} />;
    case 'emergency_help':
      return <EmergencyHelpCard data={toolOutput} />;
    case 'quote':
      return <QuoteCard data={toolOutput} />;
    case 'service_fee':
      return <ServiceFeeCard data={toolOutput} />;
    default:
      return (
        <div className="p-4 bg-gray-100 rounded-lg text-gray-600 text-center">
          <p>Unknown card type</p>
          <pre className="text-xs mt-2 text-left overflow-auto">
            {JSON.stringify(toolOutput, null, 2)}
          </pre>
        </div>
      );
  }
}

export default function App() {
  const theme = useTheme();
  const inChatGPT = isInChatGPT();

  return (
    <div 
      className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
      data-theme={theme}
    >
      {!inChatGPT && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
          <strong>Development Mode:</strong> This widget is designed to run inside ChatGPT.
          When running standalone, you can test with mock data.
        </div>
      )}
      <CardRouter />
    </div>
  );
}
