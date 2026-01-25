import { sendFollowUp } from '../hooks/useOpenAiGlobal';
import type { QuoteToolOutput } from '../types';

interface QuoteCardProps {
  data: QuoteToolOutput;
}

export function QuoteCard({ data }: QuoteCardProps) {
  const { range } = data;
  const currency = range.currency || 'USD';
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCta = async () => {
    if (data.cta) {
      await sendFollowUp(`I'd like to proceed with ${data.cta.label}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">{data.summary}</p>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center mb-4">
        <p className="text-sm text-purple-600 mb-1">Estimated Range</p>
        <p className="text-2xl font-bold text-purple-900">
          {formatPrice(range.min)} - {formatPrice(range.max)}
        </p>
      </div>

      {data.disclaimer && (
        <p className="text-xs text-gray-500 mb-4 italic">{data.disclaimer}</p>
      )}

      {data.cta && (
        <button
          onClick={handleCta}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          {data.cta.label}
        </button>
      )}
    </div>
  );
}
