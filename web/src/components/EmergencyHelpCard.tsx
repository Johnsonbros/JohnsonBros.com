import type { EmergencyHelpToolOutput } from '../types';

interface EmergencyHelpCardProps {
  data: EmergencyHelpToolOutput;
}

const SEVERITY_STYLES = {
  low: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  medium: 'bg-orange-50 border-orange-300 text-orange-800',
  high: 'bg-red-50 border-red-300 text-red-800',
  critical: 'bg-red-100 border-red-500 text-red-900',
};

export function EmergencyHelpCard({ data }: EmergencyHelpCardProps) {
  const severity = data.severity || 'high';
  const styles = SEVERITY_STYLES[severity];

  const handleCall = () => {
    if (data.contactPhone) {
      window.open(`tel:${data.contactPhone}`, '_self');
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 max-w-md mx-auto ${styles}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold">{data.title}</h3>
          {data.message && (
            <p className="text-sm mt-1">{data.message}</p>
          )}
        </div>
      </div>

      {data.instructions && data.instructions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Important Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {data.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}

      {data.contactPhone && (
        <button
          onClick={handleCall}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          {data.contactLabel || `Call ${data.contactPhone}`}
        </button>
      )}

      <p className="mt-3 text-xs text-center opacity-75">
        For life-threatening emergencies, call 911 first
      </p>
    </div>
  );
}
