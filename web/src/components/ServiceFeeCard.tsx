import { sendFollowUp, requestClose } from '../hooks/useOpenAiGlobal';
import type { ServiceFeeToolOutput } from '../types';

interface ServiceFeeCardProps {
  data: ServiceFeeToolOutput;
}

export function ServiceFeeCard({ data }: ServiceFeeCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAccept = async () => {
    await sendFollowUp('I understand and accept the service fee. Please proceed.');
    requestClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      </div>

      <div className={`p-4 rounded-lg mb-4 ${data.waived ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Service Call Fee</span>
          <div className="text-right">
            {data.waived ? (
              <div>
                <span className="text-lg font-bold text-green-600 line-through mr-2">
                  {formatPrice(data.amount)}
                </span>
                <span className="text-lg font-bold text-green-600">FREE</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-amber-700">{formatPrice(data.amount)}</span>
            )}
          </div>
        </div>
        {data.waived && (
          <p className="text-sm text-green-600 mt-2">
            Same-day service fee waived due to availability!
          </p>
        )}
      </div>

      {data.message && (
        <p className="text-sm text-gray-600 mb-4">{data.message}</p>
      )}

      <div className="text-xs text-gray-500 mb-4">
        <p>The service call fee includes:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>On-site diagnosis by a licensed technician</li>
          <li>Written estimate for repairs</li>
          <li>Credit towards approved work</li>
        </ul>
      </div>

      <button
        onClick={handleAccept}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        I Understand, Continue
      </button>
    </div>
  );
}
