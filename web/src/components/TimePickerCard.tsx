import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { callTool, sendFollowUp, useWidgetState } from '../hooks/useOpenAiGlobal';
import type { TimePickerToolOutput, TimeSlot } from '../types';

interface TimePickerCardProps {
  data: TimePickerToolOutput;
}

interface TimePickerState {
  selectedSlotId: string | null;
}

const TIME_WINDOW_ICONS: Record<string, string> = {
  MORNING: '🌅',
  MIDDAY: '☀️',
  AFTERNOON: '🌤️',
  EVENING: '🌙',
};

export function TimePickerCard({ data }: TimePickerCardProps) {
  const [state, setState] = useWidgetState<TimePickerState>({
    selectedSlotId: data.selectedSlot || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = data.selectedDate
    ? format(parseISO(data.selectedDate), 'EEEE, MMMM d, yyyy')
    : 'Selected Date';

  const handleSelectSlot = async (slot: TimeSlot) => {
    if (!slot.available) return;

    setState({ selectedSlotId: slot.id });
    setIsSubmitting(true);

    try {
      await sendFollowUp(`I'd like the ${slot.label} time slot on ${formattedDate}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slots = data.slots || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      </div>

      <p className="text-sm text-gray-600 mb-2">{formattedDate}</p>

      {data.message && (
        <p className="text-sm text-gray-500 mb-4">{data.message}</p>
      )}

      <div className="space-y-2">
        {slots.map((slot) => {
          const isSelected = state?.selectedSlotId === slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => handleSelectSlot(slot)}
              disabled={!slot.available || isSubmitting}
              className={`
                w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between
                ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                ${slot.available && !isSelected ? 'hover:border-green-300 hover:bg-green-50/50' : ''}
                ${!slot.available ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{TIME_WINDOW_ICONS[slot.timeWindow] || '⏰'}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{slot.label}</p>
                  {slot.startTime && slot.endTime && (
                    <p className="text-xs text-gray-500">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {slot.technicianCount && slot.technicianCount > 1 && (
                  <span className="text-xs text-gray-500">
                    {slot.technicianCount} techs
                  </span>
                )}
                {!slot.available && (
                  <span className="text-xs text-red-500 font-medium">Unavailable</span>
                )}
                {isSelected && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {slots.length === 0 && (
        <p className="text-center text-gray-500 py-4">No time slots available for this date.</p>
      )}

      {isSubmitting && (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Confirming...</span>
        </div>
      )}
    </div>
  );
}
