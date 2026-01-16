import { useState } from 'react';
import { sendFollowUp, useWidgetState } from '../hooks/useOpenAiGlobal';
import type { LeadCaptureToolOutput } from '../types';

interface LeadCaptureCardProps {
  data: LeadCaptureToolOutput;
}

interface LeadCaptureState {
  name: string;
  phone: string;
  issueDescription: string;
}

export function LeadCaptureCard({ data }: LeadCaptureCardProps) {
  const [state, setState] = useWidgetState<LeadCaptureState>({
    name: data.prefill?.name || '',
    phone: data.prefill?.phone || '',
    issueDescription: data.prefill?.issueDescription || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<LeadCaptureState>>({});

  const validate = (): boolean => {
    const newErrors: Partial<LeadCaptureState> = {};
    if (!state?.name?.trim()) newErrors.name = 'Name is required';
    if (!state?.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!state?.issueDescription?.trim()) newErrors.issueDescription = 'Please describe your issue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !state) return;

    setIsSubmitting(true);
    try {
      await sendFollowUp(
        `My name is ${state.name}, phone ${state.phone}. Issue: ${state.issueDescription}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      </div>

      {data.message && (
        <p className="text-sm text-gray-600 mb-4">{data.message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={state?.name || ''}
            onChange={(e) => setState({ ...state!, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Your name"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={state?.phone || ''}
            onChange={(e) => setState({ ...state!, phone: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="(617) 555-1234"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What can we help with?</label>
          <textarea
            value={state?.issueDescription || ''}
            onChange={(e) => setState({ ...state!, issueDescription: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.issueDescription ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe your plumbing issue..."
          />
          {errors.issueDescription && (
            <p className="text-xs text-red-500 mt-1">{errors.issueDescription}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Get Started'
          )}
        </button>
      </form>
    </div>
  );
}
